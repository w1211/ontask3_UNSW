from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from datetime import datetime
from mongoengine.queryset.visitor import Q

# Imports to connect to data sources
import mysql.connector
import psycopg2

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
    permission_classes = [DataSourcePermissions]

    # TO DO: make this filter based on permissions
    def get_queryset(self):
        return DataSource.objects.all()

    def get_datasource_data(self, connection):
        if connection['dbType'] == 'mysql':
            try:
                dbConnection = mysql.connector.connect(
                    host = connection['host'],
                    database = connection['database'],
                    user = connection['user'],
                    password = connection['password']
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
                    password = connection['password']
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

        return data

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        # Connect to specified database and get the data from the query
        # Data passed in to the DataSource model must be a list of dicts of the form {column_name: value}
        # TO DO: if isDynamic, then store values into lists as objects with timestamps
        connection = self.request.data['connection']
        data = self.get_datasource_data(connection)

        # Encrypt the db password of the data source
        cipher = Fernet(DATASOURCE_KEY)
        connection['password'] = cipher.encrypt(str(connection['password']))

        serializer.save(
            connection = connection,
            data = data
        )

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        # Connect to specified database and get the data from the query
        # Data passed in to the DataSource model must be a list of dicts of the form {column_name: value}
        # TO DO: if isDynamic, then store values into lists as objects with timestamps
        connection = self.request.data['connection']
        
        # Encrypt the db password of the data source
        cipher = Fernet(DATASOURCE_KEY)
        if hasattr(connection, 'password'):
            # If a new password is provided then encrypt it and overwrite the old one
            connection['password'] = cipher.encrypt(str(connection['password']))
        else:
            # Otherwise simply keep the old password (which is already encrypted)
            connection['password'] = self.get_object()['connection']['password']

        data = self.get_datasource_data(connection)

        serializer.save(
            owner = self.request.user.id,
            connection = connection,
            data = data
        )
        
    def perform_destroy(self, obj):
         # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, obj)
        
        # Ensure that no workflow is currently using this datasource
        # Because the matrix secondaryColumns field is a list of SecondaryColumn embedded documents, we use 
        # $elemMatch which is aliased to "match" in mongoengine
        queryset = Workflow.objects.filter(
            Q(matrix__secondaryColumns__match = { "datasource": obj }) | Q(matrix__primaryColumn__datasource = obj)
        )
        if queryset.count():
            raise ValidationError('This datasource is being used by a workflow')
        obj.delete()


# Decrypt the encrypted datasource db password as follows:
# cipher = Fernet(DATASOURCE_KEY)
# password = cipher.decrypt(encrypted_password)