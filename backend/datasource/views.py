from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import list_route, detail_route
from rest_framework.permissions import IsAuthenticated
from datetime import datetime

from django.http import JsonResponse

import json
import boto3
from xlrd import open_workbook

from cryptography.fernet import Fernet
from ontask.settings import SECRET_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

from .serializers import DataSourceSerializer
from .models import DataSource
from .permissions import DataSourcePermissions

from container.models import Container
from workflow.models import Workflow
from view.models import View

from .utils import retrieve_csv_data, retrieve_excel_data, retrieve_file_from_s3, retrieve_sql_data
from scheduler.backend_utils import create_scheduled_task, remove_scheduled_task, remove_async_task


class DataSourceViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = DataSourceSerializer
    permission_classes = [IsAuthenticated, DataSourcePermissions]

    def get_queryset(self):
        pipeline = [
            {
                '$lookup': {
                    'from': 'container',
                    'localField': 'container',
                    'foreignField': '_id',
                    'as': 'container'
                }
            }, {
                '$unwind': '$container'
            }, {
                '$match': {
                    'container.owner': self.request.user.id
                }
            }
        ]
        datasources = list(DataSource.objects.aggregate(*pipeline))
        return DataSource.objects.filter(id__in = [datasource['_id'] for datasource in datasources])


    #aske user for sheetname if uploading file is excel 
    @list_route(methods=['post'])
    def get_sheetnames(self, request):
        # If the payload includes a file, then simply read the sheetnames of the file
        # Otherwise, this must be an s3 bucket, in which we must first retrieve the file
        # After retrieving the file, then we can finally read the sheetnames
        if 'file' in self.request.data:
            file = self.request.data['file']

        else:
            try:
                session = boto3.Session(
                    aws_access_key_id = AWS_ACCESS_KEY_ID,
                    aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
                    region_name = AWS_REGION
                )
                s3 = session.resource('s3')
                obj = s3.Object(request.data["bucket"], request.data["fileName"])
                file = obj.get()['Body']
            except:
                raise ValidationError('Error reading file from s3 bucket')
        
        try:
            workbook = open_workbook(file_contents=file.read())
            sheetnames = workbook.sheet_names()
            data = { 'sheetnames': sheetnames }
            return JsonResponse(data)
        except:
            raise ValidationError('Error reading Excel file')


    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = DataSource.objects.filter(
            name = self.request.data['name'],
            container = self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A datasource with this name already exists')

        # If the datasource includes a file, then the payload will be a flat FormData object
        # In this case, the JSON payload was stringified, and must be parsed into a JSON object
        if 'file' in self.request.data:
            connection = json.loads(self.request.data['payload'])['connection']
            file = self.request.data['file']

            if connection['dbType'] == 'csvTextFile':
                data = retrieve_csv_data(file, connection['delimiter'])

            elif connection['dbType'] == 'xlsXlsxFile':
                data = retrieve_excel_data(file, connection['sheetname'])

        else:
            connection = self.request.data['connection']

            if connection['dbType'] == 's3BucketFile':
                data = retrieve_file_from_s3(connection)
            
            else:
                cipher = Fernet(SECRET_KEY)
                connection['password'] = cipher.encrypt(bytes(connection['password'], encoding="UTF-8"))
                data = retrieve_sql_data(connection)

        # Identify the field names from the keys of the first row of the data
        # This is sufficient, as we can assume that all rows have the same keys
        fields = list(data[0].keys())

        serializer.save(
            connection = connection,
            data = data,
            fields = fields
        )


    def perform_update(self, serializer):
        datasource = self.get_object()
        self.check_object_permissions(self.request, datasource)

        queryset = DataSource.objects.filter(
            name = self.request.data['name'],
            container = self.get_object()['container'],
            id__ne = self.get_object()['id'] # Check against datasources other than the one being updated
        )
        if queryset.count():
            raise ValidationError('A datasource with this name already exists')

        data = None

        # If the datasource includes a file, then the payload will be a flat FormData object
        # In this case, the JSON payload was stringified, and must be parsed into a JSON object
        if 'file' in self.request.data:
            connection = json.loads(self.request.data['payload'])['connection']
            file = self.request.data['file']

            if connection['dbType'] == 'csvTextFile':
                data = retrieve_csv_data(file, connection['delimiter'])

            elif connection['dbType'] == 'xlsXlsxFile':
                data = retrieve_excel_data(file, connection['sheetname'])

        else:
            connection = self.request.data['connection']

            if connection['dbType'] == 's3BucketFile':
                if not 'sheetname' in connection and 'sheetname' in datasource['connection']:
                    connection['sheetname'] = datasource['connection']['sheetname']

                if not 'delimiter' in connection and 'delimiter' in datasource['connection']:
                    connection['delimiter'] = datasource['connection']['delimiter']

                data = retrieve_file_from_s3(connection)
            
            elif connection['dbType'] in ['mysql', 'postgresql']:
                if 'password' in connection:
                    # Encrypt the db password of the data source
                    cipher = Fernet(SECRET_KEY)
                    # If a new password is provided then encrypt it and overwrite the old one
                    connection['password'] = cipher.encrypt(bytes(connection['password'], encoding="UTF-8"))
                else:
                    # Otherwise simply keep the old password (which is already encrypted)
                    connection['password'] = bytes(datasource['connection']['password'], encoding="UTF-8")

                data = retrieve_sql_data(connection)

        if data:
            # Identify the field names from the keys of the first row of the data
            # This is sufficient, as we can assume that all rows have the same keys
            fields = list(data[0].keys())

            serializer.save(
                connection = connection,
                data = data,
                fields = fields,
                lastUpdated = datetime.utcnow()
            )
        else:
            serializer.save(connection = connection)


    def perform_destroy(self, obj):
         # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, obj)

        # Ensure that no view is currently using this datasource
        queryset = View.objects.filter(columns__match = { "datasource": obj.id })
        if queryset.count():
            raise ValidationError('This datasource is being used by a view')
        self.delete_schedule(self.request, obj.id)
        obj.delete()


    @list_route(methods=['post'])
    def compare_matched_fields(self, request):
        matching_field = self.request.data['matchingField']
        matching_datasource = DataSource.objects.get(id=matching_field['datasource'])
        matching_fields = set([record[matching_field['field']] for record in matching_datasource['data']])

        primary_key = self.request.data['primaryKey']
        primary_datasource = DataSource.objects.get(id=primary_key['datasource'])
        primary_keys = set([record[primary_key['field']] for record in primary_datasource['data']])
        
        response = {}

        unique_in_matching = matching_fields - primary_keys # Values which are in the matching datasource but not the primary

        if len(unique_in_matching) == len(matching_fields):
            raise ValidationError('Matching field failed to match with the primary key. Are you sure the right matching field is set?')

        if len(unique_in_matching) > 0:
            response['matching'] = [value for value in unique_in_matching]
            response['matching_datasource_name'] = matching_datasource.name

        unique_in_primary = primary_keys - matching_fields # Values which are in the primary datasource but not the matching

        if len(unique_in_primary) > 0:
            response['primary'] = [value for value in unique_in_primary]
            response['primary_datasource_name'] = primary_datasource.name

        return JsonResponse(response, safe=False)

    @detail_route(methods=['patch'])
    def delete_schedule(self, request, id=None):
        datasource = DataSource.objects.get(id=id)

        if 'schedule' in datasource and 'taskName' in datasource['schedule']:
            remove_scheduled_task(datasource['schedule']['taskName'])

        if 'schedule' in datasource and 'asyncTasks' in datasource['schedule']:
            remove_async_task(datasource['schedule']['asyncTasks'])

        datasource.update(unset__schedule=1)

        return JsonResponse({ "success": True })


    @detail_route(methods=['patch'])
    def update_schedule(self, request, id=None):
        datasource = DataSource.objects.get(id=id)
        arguments = json.dumps({ "datasource_id": id })

        # If a schedule already exists for this datasource, then delete it
        if 'schedule' in datasource and 'taskName' in datasource['schedule']:
            remove_scheduled_task(datasource['schedule']['taskName'])

        if 'schedule' in datasource and 'asyncTasks' in datasource['schedule']:
            remove_async_task(datasource['schedule']['asyncTasks'])

        datasource.update(unset__schedule=1)

        #create updated schedule tasks
        task_name, async_tasks = create_scheduled_task('refresh_datasource_data', request.data, arguments)

        if task_name:
            schedule = request.data
            schedule['taskName'] = task_name
            schedule['asyncTasks'] = async_tasks
            serializer = DataSourceSerializer(datasource, data={
                'schedule': schedule
            }, partial=True)
            serializer.is_valid()
            serializer.save()
            return JsonResponse({ "success":True }, safe=False)
        else:
            return JsonResponse({ "success": False }, safe=False)
