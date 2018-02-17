from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from datetime import datetime
from rest_framework.decorators import list_route
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

# Imports for encrypting the datasource db password
from cryptography.fernet import Fernet
from ontask.settings import SECRET_KEY

from .serializers import DataSourceSerializer
from .models import DataSource
from .permissions import DataSourcePermissions

from container.models import Container
from workflow.models import Workflow


class DataSourceViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = DataSourceSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [DataSourcePermissions]

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

    def get_csv_data(self, csv_file, separator_char=','):
        #checking file format
        reader = csv.DictReader(io.StringIO(csv_file.read().decode('utf-8')), delimiter=separator_char)
        data = list(reader)
        fields = list(data[0].keys())
        return (data, fields)

    def get_xls_data(self, xls_file, sheetname):
        book = open_workbook(file_contents=xls_file.read())
        sheet = book.sheet_by_name(sheetname)
        # read header values into the list
        keys = [sheet.cell(0, col_index).value for col_index in range(sheet.ncols)]
        dict_list = []
        for row_index in range(1, sheet.nrows):
            d = {keys[col_index]: sheet.cell(row_index, col_index).value
                 for col_index in range(sheet.ncols)}
            dict_list.append(d)
        return (dict_list, keys)

    @list_route(methods=['post'])
    def get_sheetnames(self, request):
        xls_file = request.data["file"]
        workbook = open_workbook(file_contents=xls_file.read())
        sheetnames = workbook.sheet_names()
        data = {}
        data["sheetnames"] = sheetnames
        return JsonResponse(data, safe=False)


    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        # Connect to specified database and get the data from the query
        # Data passed in to the DataSource model must be a list of dicts of the form {column_name: value}
        # TO DO: if isDynamic, then store values into lists as objects with timestamps
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

        # Ensure that no workflow is currently using this datasource
        # Because the details secondaryColumns field is a list of SecondaryColumn embedded documents, we use
        # $elemMatch which is aliased to "match" in mongoengine
        queryset = Workflow.objects.filter(
            Q(details__secondaryColumns__match = { "datasource": obj }) | Q(details__primaryColumn__datasource = obj)
        )
        if queryset.count():
            raise ValidationError('This datasource is being used by a workflow')
        obj.delete()
