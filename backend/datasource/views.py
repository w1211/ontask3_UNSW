from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from datetime import datetime

# Imports to connect to data sources
import mysql.connector
import psycopg2

from .serializers import DataSourceSerializer
from .models import DataSource
from matrix.models import Matrix
from ontask.permissions import IsOwner


class DataSourceViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = DataSourceSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        return DataSource.objects.all()

    def perform_create(self, serializer):
        # Check that the data source to be created is unique on (owner, name)
        queryset = DataSource.objects.filter(
            owner = self.request.user.id,
            metadata__name = self.request.data['name']
        )
        if queryset.count():
            raise ValidationError('A data source with this name already exists')

        # Map attributes from the http request to the subdocument schemas
        connection = {}
        connection['dbType'] = self.request.data['dbType']
        connection['host'] = self.request.data['host']
        connection['database'] = self.request.data['database']
        connection['user'] = self.request.data['user']
        connection['password'] = self.request.data['password']
        connection['query'] = self.request.data['query']

        metadata = {}
        metadata['name'] = self.request.data['name']
        metadata['isDynamic'] = (self.request.data['isDynamic'] == 'true') # Convert string to boolean
        metadata['updateFrequency'] = self.request.data['updateFrequency']
        metadata['lastUpdated'] = datetime.now()

        # Connect to specified database and get the data from the query
        # Data passed in to the DataSource model must be a list of dicts of the form {column_name: value}
        dbType = self.request.data['dbType']

        # TO DO: if isDynamic, then store values into lists as objects with timestamps
        if dbType == 'mysql':
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

        elif dbType == 'postgresql':
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

        # TO DO: implement MS SQL and SQLite imports
        elif dbType == 'sqlite':
            pass
        
        elif dbType == 'mssql':
            pass

        serializer.save(
            owner = self.request.user.id,
            connection = connection,
            metadata = metadata,
            data = data
        )

    def perform_destroy(self, obj):
         # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, obj)
        
        # Ensure that no matrix is currently using this datasource
        # Because the secondaryColumns field is a list of SecondaryColumn embedded documents, we use 
        # $elemMatch which is aliased to "match" in mongoengine
        queryset = Matrix.objects.filter(
            owner = self.request.user.id,
            secondaryColumns__match = { "datasource": obj }
        )
        if queryset.count():
            raise ValidationError('This datasource is being used by a matrix')
        obj.delete()
    