from django.http import JsonResponse, HttpResponse
from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import list_route, detail_route
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from mongoengine.queryset.visitor import Q

import json
import boto3
from xlrd import open_workbook
from datetime import datetime as dt
import os
import pandas as pd

from cryptography.fernet import Fernet
from ontask.settings import SECRET_KEY

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
    process_data,
)
from scheduler.utils import create_task, delete_task

from container.models import Container
from datalab.models import Datalab

import logging

logger = logging.getLogger("ontask")


class DatasourceViewSet(viewsets.ModelViewSet):
    lookup_field = "id"
    serializer_class = DatasourceSerializer
    permission_classes = [IsAuthenticated, DatasourcePermissions]

    def get_queryset(self):
        # Get the containers this user owns or has access to
        containers = Container.objects.filter(
            Q(owner=self.request.user.email)
            | Q(sharing__contains=self.request.user.email)
        )

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
                data = retrieve_csv_data(file, connection["files"][0]["delimiter"])

            elif connection["dbType"] == "xlsXlsxFile":
                data = retrieve_excel_data(file, connection["files"][0]["sheetname"])

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

        data = process_data(data)

        # Identify the field names from the keys of the first row of the data
        # This is sufficient, as we can assume that all rows have the same keys
        fields = list(data[0].keys())
        types = guess_column_types(data)

        datasource = serializer.save(
            connection=connection, data=data, fields=fields, types=types
        )

        if "file" in self.request.data:
            logger.info(
                "datasource.create",
                extra={"user": self.request.user.email, "payload": json.loads(self.request.data["payload"])},
            )
        else:
            logger.info(
                "datasource.create",
                extra={"user": self.request.user.email, "payload": self.request.data},
            )   

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
                data = retrieve_csv_data(file, connection["files"][0]["delimiter"])

            elif connection["dbType"] == "xlsXlsxFile":
                data = retrieve_excel_data(file, connection["files"][0]["sheetname"])

        else:
            connection = self.request.data["connection"]

            if connection["dbType"] == "s3BucketFile":
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

        if connection["dbType"] not in [
            "mysql",
            "postgresql",
            "sqlite",
            "mssql",
            "s3BucketFile",
        ]:
            self.delete_schedule(self.request, datasource.id)

        if data:
            data = process_data(data)

            # Identify the field names from the keys of the first row of the data
            # This is sufficient, as we can assume that all rows have the same keys
            fields = list(data[0].keys())
            types = guess_column_types(data)

            datasource = serializer.save(
                connection=connection,
                data=data,
                fields=fields,
                types=types,
                lastUpdated=dt.utcnow(),
            )
            datasource.update_associated_datalabs()
        else:
            serializer.save(connection=connection)

        if "file" in self.request.data:
            logger.info(
                "datasource.update",
                extra={"user": self.request.user.email, "payload": json.loads(self.request.data["payload"])},
            )
        else:
            logger.info(
                "datasource.update",
                extra={"user": self.request.user.email, "payload": self.request.data},
            )   

    def perform_destroy(self, datasource):
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

        logger.info(
            "datasource.delete",
            extra={"user": self.request.user.email, "datasource": str(datasource.id)},
        )

    @detail_route(methods=["patch"])
    def update_schedule(self, request, id):
        datasource = self.get_object()

        self.check_object_permissions(self.request, datasource)

        # If a schedule already exists for this datasource, then delete it
        if "schedule" in datasource:
            delete_task(datasource.schedule.task_name)

        task_name = create_task(
            "refresh_datasource_data", request.data, {"datasource_id": id}
        )
        request.data["task_name"] = task_name

        serializer = DatasourceSerializer(
            datasource, data={"schedule": request.data}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        logger.info(
            "datasource.update_schedule",
            extra={"user": self.request.user.email, "payload": self.request.data},
        )

        return Response(serializer.data)

    @detail_route(methods=["patch"])
    def delete_schedule(self, request, id=None):
        datasource = self.get_object()

        self.check_object_permissions(self.request, datasource)

        if "schedule" in datasource:
            delete_task(datasource.schedule.task_name)
            datasource.schedule = None
            datasource.save()

        logger.info(
            "datasource.delete_schedule",
            extra={"user": self.request.user.email, "datasource": str(datasource.id)},
        )

        serializer = DatasourceSerializer(datasource)
        return JsonResponse(serializer.data)

    @list_route(methods=["post"])
    def get_sheetnames(self, request):
        # If the payload includes a file, then simply read the sheetnames of the file
        # Otherwise, this must be an s3 bucket, in which we must first retrieve the file
        # After retrieving the file, then we can finally read the sheetnames
        if "file" in self.request.data:
            file = self.request.data["file"]

        else:
            try:
                s3 = boto3.resource("s3")
                obj = s3.Object(request.data["bucket"], request.data["name"])
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

    @detail_route(methods=["post"])
    def force_refresh(self, request, id=None):
        datasource = self.get_object()
        self.check_object_permissions(self.request, datasource)

        datasource.refresh_data()
        serializer = DatasourceSerializer(datasource)
        return Response(serializer.data)

    @detail_route(methods=["post"])
    def csv(self, request, id=None):
        datasource = self.get_object()
        self.check_object_permissions(self.request, datasource)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f"attachment; filename={datasource.name}.csv"
        response["Access-Control-Expose-Headers"] = "Content-Disposition"
        data = pd.DataFrame(datasource.data)

        # Re-order the columns to match the original datasource data
        data = data.reindex(columns=list(datasource.data[0].keys()))

        data.to_csv(path_or_buf=response, index=False)

        logger.info(
            "datasource.export_to_csv",
            extra={"user": self.request.user.email, "datasource": str(datasource.id)},
        )

        return response
