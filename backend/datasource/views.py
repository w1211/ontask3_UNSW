from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import list_route
from rest_framework.permissions import IsAuthenticated
from datetime import datetime

from django.http import JsonResponse

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from mongoengine.queryset.visitor import Q

# Imports to connect to data sources
import mysql.connector
import psycopg2

import json
import csv
import io
from xlrd import open_workbook

import boto3

# Imports for encrypting the datasource db password
from cryptography.fernet import Fernet
from ontask.settings import SECRET_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

from .serializers import DataSourceSerializer
from .models import DataSource
from .permissions import DataSourcePermissions

from container.models import Container
from workflow.models import Workflow
from view.models import View


class DataSourceViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = DataSourceSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
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

    def get_datasource_data(self, connection):
        cipher = Fernet(SECRET_KEY)
        decrypted_password = cipher.decrypt(connection['password'])

        if connection['dbType'] == 'mysql':
            try:
                dbConnection = mysql.connector.connect(
                    host = connection['host'],
                    database = connection['database'],
                    user = connection['user'],
                    password = decrypted_password
                )
                cursor = dbConnection.cursor(dictionary=True)
                cursor.execute(connection['query'])
                data = list(cursor)
                cursor.close()
                dbConnection.close()
            except:
                raise ValidationError('Error connecting to database')

        elif connection['dbType'] == 'postgresql':
            try:
                dbConnection = psycopg2.connect(
                    host = connection['host'],
                    dbname = connection['database'],
                    user = connection['user'],
                    password = decrypted_password
                )
                cursor = dbConnection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cursor.execute(connection['query'])
                data = list(cursor)
                cursor.close()
                dbConnection.close()
            except:
                raise ValidationError('Error connecting to database')

        # TO DO: implement MS SQL and SQLite imports
        elif connection['dbType'] == 'sqlite':
            pass

        elif connection['dbType'] == 'mssql':
            pass

        if not len(data):
            raise ValidationError('The query returned no data')

        # Assuming that every record in the returned queryset has the same columns,
        # We can map the column names to know what fields are available from the data source
        # Field names consumed by workflow details definition
        fields = list(data[0].keys())

        return (data, fields)

    #get data from csv file with default separator "," or user specified
    def get_csv_data(self, csv_file, separator_char=','):
        #checking file format
        reader = csv.DictReader(io.StringIO(csv_file.read().decode('utf-8')), delimiter=separator_char)
        data = list(reader)
        fields = list(data[0].keys())
        return (data, fields)

    #get excel data with user specified sheetname
    def get_xls_data(self, xls_file, sheetname):
        book = open_workbook(file_contents=xls_file.read())
        sheet = book.sheet_by_name(sheetname)
        print("get sheet from book")
        # read header values into the list
        keys = [sheet.cell(0, col_index).value for col_index in range(sheet.ncols)]
        dict_list = []
        for row_index in range(1, sheet.nrows):
            d = {keys[col_index]: sheet.cell(row_index, col_index).value
                 for col_index in range(sheet.ncols)}
            dict_list.append(d)
        return (dict_list, keys)

    #aske user for sheetname if uploading file is excel 
    @list_route(methods=['post'])
    def get_sheetnames(self, request):
        try:
            xls_file = request.data["file"]
            workbook = open_workbook(file_contents=xls_file.read())
            sheetnames = workbook.sheet_names()
            data = {}
            data["sheetnames"] = sheetnames
            return JsonResponse(data, safe=False)
        except:
            raise ValidationError('Error reading file from s3 bucket')

    #ask user for sheetname if s3 file is excel
    @list_route(methods=['post'])
    def get_s3_sheetnames(self, request):
        try:
            session = boto3.Session(
                aws_access_key_id = AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name='ap-southeast-2'
            )
            s3 = session.resource('s3')
            print(request.data)
            obj = s3.Object(request.data["bucket"], request.data["fileName"])
            xls_file = obj.get()['Body']
            workbook = open_workbook(file_contents=xls_file.read())
            sheetnames = workbook.sheet_names()
            data = {}
            data["sheetnames"] = sheetnames
            return JsonResponse(data, safe=False)
        except:
            raise ValidationError('Error reading file from s3 bucket')

    def get_s3bucket_file_data(self, bucket, file_name, delimiter=None, sheetname=None):
        try:
            session = boto3.Session(
                aws_access_key_id = AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name='ap-southeast-2'
            )
            s3 = session.resource('s3')
            obj = s3.Object(bucket, file_name)
            file = obj.get()['Body']
            if file_name.lower().endswith(('.csv', '.txt')):
                return self.get_csv_data(file, delimiter)
            elif file_name.lower().endswith(('.xls', '.xlsx')):
                return self.get_xls_data(file, sheetname)
            else:
                raise ValidationError('File type is not supported')
        except:
            raise ValidationError('Error reading file from s3 bucket')
        
    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)
        queryset = DataSource.objects.filter(
            name = self.request.data['name'],
            container = self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A datasource with this name already exists')

        # Connect to specified database and get the data from the query
        # Data passed in to the DataSource model must be a list of dicts of the form {column_name: value}
        # TO DO: if isDynamic, then store values into lists as objects with timestamps
        if 'dbType' in self.request.data:
            if self.request.data['dbType']=='csvTextFile':
                connection = {}
                connection['dbType'] = 'csvTextFile'
                external_file = self.request.data['file']
                delimiter = self.request.data['delimiter']
                (data, fields) = self.get_csv_data(external_file, delimiter)

            elif self.request.data['dbType']=='xlsXlsxFile':
                connection = {}
                connection['dbType'] = 'xlsXlsxFile'
                external_file = self.request.data['file']
                sheetname = self.request.data['sheetname']
                (data, fields) = self.get_xls_data(external_file, sheetname)

        # connect to s3 bucket and get the file
        elif self.request.data['connection']['dbType'] == 's3BucketFile':
            connection = self.request.data['connection']
            bucket = self.request.data['bucket']
            file_name = self.request.data['fileName']
            delimiter = self.request.data['delimiter'] if ('delimiter' in self.request.data) else None
            sheetname = self.request.data['sheetname'] if ('sheetname' in self.request.data) else None
            (data, fields) = self.get_s3bucket_file_data(bucket, file_name, delimiter, sheetname)
        else:
            connection = self.request.data['connection']
            # Encrypt the db password of the data source
            cipher = Fernet(SECRET_KEY)
            connection['password'] = cipher.encrypt(bytes(connection['password'], encoding="UTF-8"))
            (data, fields) = self.get_datasource_data(connection)

        serializer.save(
            connection = connection,
            data = data,
            fields = fields
        )

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        queryset = DataSource.objects.filter(
            name = self.request.data['name'],
            container = self.get_object()['container'],
            id__ne = self.get_object()['id'] # Check against datasources other than the one being updated
        )
        if queryset.count():
            raise ValidationError('A datasource with this name already exists')

        if 'dbType' in self.request.data:
            if self.request.data['dbType']=='csvTextFile':
                connection = {}
                connection['dbType'] = 'csvTextFile'
                external_file = self.request.data['file']
                delimiter = self.request.data['delimiter']
                (data, fields) = self.get_csv_data(external_file, delimiter)
            
            elif self.request.data['dbType']=='xlsXlsxFile':
                connection = {}
                connection['dbType'] = 'xlsXlsxFile'
                external_file = self.request.data['file']
                sheetname = self.request.data['sheetname']
                (data, fields) = self.get_xls_data(external_file, sheetname)
        
        elif self.request.data['connection']['dbType'] == 's3BucketFile':
            connection = self.request.data['connection']
            bucket = self.request.data['bucket']
            file_name = self.request.data['fileName']
            delimiter = self.request.data['delimiter']
            (data, fields) = self.get_s3bucket_file_data(bucket, file_name, delimiter)

        else:
            connection = self.request.data['connection']
            if 'password' in connection:
                # Encrypt the db password of the data source
                cipher = Fernet(SECRET_KEY)
                # If a new password is provided then encrypt it and overwrite the old one
                connection['password'] = cipher.encrypt(bytes(connection['password'], encoding="UTF-8"))
            else:
                # Otherwise simply keep the old password (which is already encrypted)
                connection['password'] = bytes(self.get_object()['connection']['password'], encoding="UTF-8")

            (data, fields) = self.get_datasource_data(connection)

        serializer.save(
            connection = connection,
            data = data,
            fields = fields
        )

    def perform_destroy(self, obj):
         # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, obj)

        # Ensure that no view is currently using this datasource
        queryset = View.objects.filter(columns__match = { "datasource": obj.id })
        if queryset.count():
            raise ValidationError('This datasource is being used by a view')
            
        obj.delete()

    @list_route(methods=['post'])
    def compare_matched_fields(self, request):

        def json_serial(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            if isinstance(obj, ObjectId):
                return str(obj)

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

        unique_in_primary = primary_keys - matching_fields # Values which are in the primary datasource but not the matching

        if len(unique_in_primary) > 0:
            response['primary'] = [value for value in unique_in_primary]

        return JsonResponse(response, safe=False)