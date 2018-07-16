from django.http import JsonResponse
from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import list_route, detail_route
from rest_framework.permissions import IsAuthenticated

import json
import boto3
from xlrd import open_workbook
from datetime import datetime

from cryptography.fernet import Fernet
from ontask.settings import (
    SECRET_KEY,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
)

from .serializers import DatasourceSerializer
from .models import Datasource
from .permissions import DatasourcePermissions

from container.models import Container

from .utils import (
    retrieve_csv_data,
    retrieve_excel_data,
    retrieve_file_from_s3,
    retrieve_sql_data,
    guess_column_types,
)
from scheduler.methods import (
    create_scheduled_task,
    remove_scheduled_task,
    remove_async_task,
)

from audit.serializers import AuditSerializer
from container.views import ContainerViewSet
from datalab.models import Datalab


class DatasourceViewSet(viewsets.ModelViewSet):
    lookup_field = "id"
    serializer_class = DatasourceSerializer
    permission_classes = [IsAuthenticated, DatasourcePermissions]

    def get_queryset(self):
        # Get the containers this user owns or has access to
        containers = ContainerViewSet.get_queryset(self)

        # Retrieve only the datasources that belong to these containers
        datasources = Datasource.objects(container__in=containers)

        return datasources

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = Datasource.objects.filter(
            name=self.request.data["name"], container=self.request.data["container"]
        )
        if queryset.count():
            raise ValidationError(
                "A datasource with this name already exists in the container"
            )

        # If the datasource includes a file, then the payload will be a flat FormData object
        # In this case, the JSON payload was stringified, and must be parsed into a JSON object
        if "file" in self.request.data:
            connection = json.loads(self.request.data["payload"])["connection"]
            file = self.request.data["file"]

            if connection["dbType"] == "csvTextFile":
                data = retrieve_csv_data(file, connection["delimiter"])

            elif connection["dbType"] == "xlsXlsxFile":
                data = retrieve_excel_data(file, connection["sheetname"])

        else:
            connection = self.request.data["connection"]

            if connection["dbType"] == "s3BucketFile":
                data = retrieve_file_from_s3(connection)

            else:
                cipher = Fernet(SECRET_KEY)
                connection["password"] = cipher.encrypt(
                    bytes(connection["password"], encoding="UTF-8")
                )
                data = retrieve_sql_data(connection)

        if not len(data):
            raise ValidationError("No data was returned from the datasource")

        # Identify the field names from the keys of the first row of the data
        # This is sufficient, as we can assume that all rows have the same keys
        fields = list(data[0].keys())

        datasource = serializer.save(connection=connection, data=data, fields=fields)

        audit = AuditSerializer(
            data={
                "model": "datasource",
                "document": str(datasource.id),
                "action": "create",
                "user": self.request.user.email,
            }
        )
        audit.is_valid()
        audit.save()

    def perform_update(self, serializer):
        datasource = self.get_object()
        self.check_object_permissions(self.request, datasource)

        queryset = Datasource.objects.filter(
            name=self.request.data["name"],
            container=datasource["container"],
            # Check against datasources other than the one being updated
            id__ne=datasource["id"],
        )
        if queryset.count():
            raise ValidationError("A datasource with this name already exists")

        data = None

        # If the datasource includes a file, then the payload will be a flat FormData object
        # In this case, the JSON payload was stringified, and must be parsed into a JSON object
        if "file" in self.request.data:
            connection = json.loads(self.request.data["payload"])["connection"]
            file = self.request.data["file"]

            if connection["dbType"] == "csvTextFile":
                data = retrieve_csv_data(file, connection["delimiter"])

            elif connection["dbType"] == "xlsXlsxFile":
                data = retrieve_excel_data(file, connection["sheetname"])

        else:
            connection = self.request.data["connection"]

            if connection["dbType"] == "s3BucketFile":
                if (
                    not "sheetname" in connection
                    and "sheetname" in datasource["connection"]
                ):
                    connection["sheetname"] = datasource["connection"]["sheetname"]

                if (
                    not "delimiter" in connection
                    and "delimiter" in datasource["connection"]
                ):
                    connection["delimiter"] = datasource["connection"]["delimiter"]

                data = retrieve_file_from_s3(connection)

            elif connection["dbType"] in ["mysql", "postgresql"]:
                if "password" in connection:
                    # Encrypt the db password of the data source
                    cipher = Fernet(SECRET_KEY)
                    # If a new password is provided then encrypt it and overwrite the old one
                    connection["password"] = cipher.encrypt(
                        bytes(connection["password"], encoding="UTF-8")
                    )
                else:
                    # Otherwise simply keep the old password (which is already encrypted)
                    connection["password"] = bytes(
                        datasource["connection"]["password"], encoding="UTF-8"
                    )

                data = retrieve_sql_data(connection)

        if data:
            # Identify the field names from the keys of the first row of the data
            # This is sufficient, as we can assume that all rows have the same keys
            fields = list(data[0].keys())
            types = guess_column_types(data)

            serializer.save(
                connection=connection,
                data=data,
                fields=fields,
                types=types,
                lastUpdated=datetime.utcnow(),
            )
        else:
            serializer.save(connection=connection)

        # Identify the changes made to the datasource
        diff = {}

        if datasource["name"] != serializer.instance["name"]:
            diff["name"] = {
                "from": datasource["name"],
                "to": serializer.instance["name"],
            }

        for field in datasource["connection"]:
            old_value = datasource["connection"][field]
            new_value = serializer.instance["connection"][field]

            if old_value != new_value:
                if "connection" not in diff:
                    diff["connection"] = {}

                if field == "password":
                    # Don't actually store the password changes in the audit table
                    # (even though the datasource password is hashed when saved)
                    diff["connection"][field] = "changed"
                else:
                    diff["connection"][field] = {"from": old_value, "to": new_value}

        # If changes were detected, add a record to the audit collection
        if len(diff.keys()):
            audit = AuditSerializer(
                data={
                    "model": "datasource",
                    "document": str(datasource.id),
                    "action": "edit",
                    "user": self.request.user.email,
                    "diff": diff,
                }
            )
            audit.is_valid()
            audit.save()

    def perform_destroy(self, datasource):
        request_user = self.request.user.email

        # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, datasource)

        # Ensure that no data lab is currently using this datasource
        pipeline = [
            {"$unwind": "$steps"},
            {"$match": {"steps.datasource.id": str(datasource.id)}},
        ]
        data_labs = list(Datalab.objects.aggregate(*pipeline))
        if len(data_labs):
            raise ValidationError("This datasource is being used by a DataLab")

        self.delete_schedule(self.request, datasource.id)
        datasource.delete()

        audit = AuditSerializer(
            data={
                "model": "datasource",
                "document": str(datasource.id),
                "action": "delete",
                "user": request_user,
            }
        )
        audit.is_valid()
        audit.save()

    @detail_route(methods=["patch"])
    def update_schedule(self, request, id):
        datasource = self.get_object()

        self.check_object_permissions(self.request, datasource)

        schedule = request.data
        serializer = DatasourceSerializer(
            datasource, data={"schedule": schedule}, partial=True
        )
        serializer.is_valid()

        # Identify the changes made to the datasource schedule
        diff = {}
        for field in datasource["schedule"]:
            old_value = datasource["schedule"][field]
            new_value = serializer.validated_data["schedule"].get(field, old_value)

            # Strip timezone information from the new value if it is a datetime
            # The db model does not include tz info, whereas the validated data does.
            # Therefore even if the time is identical (both always in UTC), the
            # comparison will produce a false negative
            if type(new_value) == datetime:
                new_value = new_value.replace(tzinfo=None)

            if old_value != new_value:
                diff[field] = {"from": old_value, "to": new_value}

        # If changes were detected, then continue
        if len(diff.keys()):
            # If a schedule already exists for this datasource, then delete it
            if "schedule" in datasource and "taskName" in datasource["schedule"]:
                remove_scheduled_task(datasource["schedule"]["taskName"])

            if "schedule" in datasource and "asyncTasks" in datasource["schedule"]:
                remove_async_task(datasource["schedule"]["asyncTasks"])

            # Create new schedule tasks
            arguments = json.dumps({"datasource_id": id})
            task_name, async_tasks = create_scheduled_task(
                "refresh_datasource_data", request.data, arguments
            )

            serializer.validated_data["schedule"]["taskName"] = task_name
            serializer.validated_data["schedule"]["asyncTasks"] = async_tasks
            serializer.save()

            audit = AuditSerializer(
                data={
                    "model": "datasource",
                    "document": str(datasource.id),
                    "action": "update_schedule",
                    "user": self.request.user.email,
                    "diff": diff,
                }
            )
            audit.is_valid()
            audit.save()

        return JsonResponse({"success": True})

    @detail_route(methods=["patch"])
    def delete_schedule(self, request, id=None):
        datasource = self.get_object()

        self.check_object_permissions(self.request, datasource)

        if "schedule" in datasource and "taskName" in datasource["schedule"]:
            remove_scheduled_task(datasource["schedule"]["taskName"])

        if "schedule" in datasource and "asyncTasks" in datasource["schedule"]:
            remove_async_task(datasource["schedule"]["asyncTasks"])

        datasource.update(unset__schedule=1)

        audit = AuditSerializer(
            data={
                "model": "datasource",
                "document": str(datasource.id),
                "action": "delete_schedule",
                "user": self.request.user.email,
            }
        )
        audit.is_valid()
        audit.save()

        return JsonResponse({"success": True})

    @list_route(methods=["post"])
    def compare_matched_fields(self, request):
        matching_field = self.request.data["matchingField"]
        matching_datasource = Datasource.objects.get(id=matching_field["datasource"])
        matching_fields = set(
            [record[matching_field["field"]] for record in matching_datasource["data"]]
        )

        primary_key = self.request.data["primaryKey"]
        primary_datasource = Datasource.objects.get(id=primary_key["datasource"])
        primary_keys = set(
            [record[primary_key["field"]] for record in primary_datasource["data"]]
        )

        response = {}

        # Values which are in the matching datasource but not the primary
        unique_in_matching = matching_fields - primary_keys

        if len(unique_in_matching) == len(matching_fields):
            raise ValidationError(
                "Matching field failed to match with the primary key. Are you sure the right matching field is set?"
            )

        if len(unique_in_matching) > 0:
            response["matching"] = [value for value in unique_in_matching]
            response["matching_datasource_name"] = matching_datasource.name

        # Values which are in the primary datasource but not the matching
        unique_in_primary = primary_keys - matching_fields

        if len(unique_in_primary) > 0:
            response["primary"] = [value for value in unique_in_primary]
            response["primary_datasource_name"] = primary_datasource.name

        return JsonResponse(response, safe=False)

    @list_route(methods=["post"])
    def get_sheetnames(self, request):
        # If the payload includes a file, then simply read the sheetnames of the file
        # Otherwise, this must be an s3 bucket, in which we must first retrieve the file
        # After retrieving the file, then we can finally read the sheetnames
        if "file" in self.request.data:
            file = self.request.data["file"]

        else:
            try:
                session = boto3.Session(
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                    region_name=AWS_REGION,
                )
                s3 = session.resource("s3")
                obj = s3.Object(request.data["bucket"], request.data["fileName"])
                file = obj.get()["Body"]
            except:
                raise ValidationError("Error reading file from s3 bucket")

        try:
            workbook = open_workbook(file_contents=file.read())
            sheetnames = workbook.sheet_names()
            data = {"sheetnames": sheetnames}
            return JsonResponse(data)
        except:
            raise ValidationError("Error reading Excel file")

