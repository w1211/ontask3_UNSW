from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from datetime import datetime
from mongoengine.queryset.visitor import Q

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# Imports to connect to data sources
import mysql.connector
import psycopg2

import json
import csv
import io

# Imports for encrypting the datasource db password
from cryptography.fernet import Fernet
from ontask.settings import DATASOURCE_KEY

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

    # TO DO: make this filter based on permissions
    def get_queryset(self):
        return DataSource.objects.all()

    def get_datasource_data(self, connection):
        cipher = Fernet(DATASOURCE_KEY)
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

    def get_csv_data(self, csv_file):
        #checking file format
        if not csv_file.name.endswith('.csv'):
            raise ValidationError('File is not CSV type')
            return
        reader = csv.DictReader(io.StringIO(csv_file.read().decode('utf-8')))
        data = list(reader)
        fields = data[0].keys()
        return (data, fields)


    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        # Connect to specified database and get the data from the query
        # Data passed in to the DataSource model must be a list of dicts of the form {column_name: value}
        # TO DO: if isDynamic, then store values into lists as objects with timestamps
        if self.request.data['dbType']=='csv':
            connection = {}
            connection['dbType'] = 'csv'
            csv_file = self.request.data['file']
            (data, fields) = self.get_csv_data(csv_file)
        else:
            connection = self.request.data['connection']
            # Encrypt the db password of the data source
            cipher = Fernet(DATASOURCE_KEY)
            connection['password'] = cipher.encrypt(bytes(connection['password'], encoding="UTF-8"))
            (data, fields) = self.get_datasource_data(connection)

        serializer.save(
            connection = connection,
            data = data,
            fields = fields
        )

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        connection = self.request.data['connection']

        if self.request.data['connection']['dbType']=='csv':
            if hasattr(self.request.data, 'file'):
                csv_file = self.request.data['file']
                (data, fields) = self.get_csv_data(csv_file)
            else:
                data = self.get_object()['data']
                fields = self.get_object()['fields']
        else:
            if hasattr(connection, 'password'):
                # Encrypt the db password of the data source
                cipher = Fernet(DATASOURCE_KEY)
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
