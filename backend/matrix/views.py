from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route

from django.http import JsonResponse

from .serializers import MatrixSerializer
from .models import Matrix
from datasource.models import DataSource

from itertools import groupby

class MatrixViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = MatrixSerializer

    def get_queryset(self):
        return Matrix.objects.all()

    def perform_create(self, serializer):
        # We are manually checking that the combination of (owner, code) is unique
        # We cannot take advantage of MongoEngine's inbuilt "unique_with" attribute in the Matrix model
        # Because we are not sending the owner attribute in the request body (rather, it is provided by the request.user)
        queryset = Matrix.objects.filter(
            owner = self.request.user.id,
            name = self.request.data['name']
        )
        if queryset.count():
            raise ValidationError('A matrix with this name already exists')
        serializer.save(owner=self.request.user.id)

    def perform_update(self, serializer):
        queryset = Container.objects.filter(
            # We only want to check against the documents that are not the document being updated
            # I.e. only include objects in the filter that do not have the same id as the current object
            # id != self.kwargs.get(self.lookup_field) is syntactically incorrect
            # So instead we are making use of a query operator [field]__ne (i.e. field not equal to)
            # Refer to http://docs.mongoengine.org/guide/querying.html#query-operators for more information
            id__ne = self.kwargs.get(self.lookup_field), # Get the id of the object from the url route as defined by the lookup_field
            owner = self.request.user.id,
            name = self.request.data['name']
        )
        if queryset.count():
            raise ValidationError('A matrix with this name already exists')
        serializer.save()

    @detail_route(methods=['get'])
    def get_data(self, request, id=None):
        matrix = Matrix.objects.get(id=id)

        # Create a dict of dicts which will hold the values for each secondary column
        # Our goal is to end up with something like:
        # column_data = {
        #   'firstName': { 1: 'John', 2: 'Frank', 3: 'Billy' },
        #   'lastName': { 1: 'Smith', 2: 'Johnson', 3: 'Sanders' },
        # }
        # I.e. User with id 1 is John Smith
        column_data = {}

        # To do: group by datasource first
        for column in matrix['secondaryColumns']:
            data = column.datasource.data # Imported data source which was saved as a dictField in the Matrix model
            matching_column = column.matchesWith # E.g. "id"
            field_name = column.field # E.g. "firstName"

            # For each secondary column, create a dict which is a key-value pair of matching_column with the respective field value
            column_values = {}
            for row in data:
                matching_column_value = row[matching_column] # E.g. 1
                field_value = row[field_name] # E.g. John
                # Add key-value pair of the form { matching_column_value: field_value } to the column dict 
                # E.g. { 1: 'John' } in the case of { id: firstName }
                column_values[matching_column_value] = field_value

            # Add the secondary column values to the dict holding all of the secondary column values
            # E.g. column_data['firstName'] = { 1: 'John', 2: 'Frank', 3: 'Billy' }
            column_data[field_name] = column_values

        primaryColumn = matrix['primaryColumn']
        primaryField = primaryColumn.field
        primaryData = primaryColumn.datasource.data
        data = []
        
        for row in primaryData:
            # Construct a dict which will represent a single joined record
            item = {}
            item[primaryField] = row[primaryField] # E.g. item['id'] = 1
            # Loop through the defined secondary columns and get the data for this particular record's id for each column
            for secondary_column in matrix['secondaryColumns']:
                # E.g. item['firstName'] = column_data['firstName'][1] gets the firstName of user with id 1
                item[secondary_column.field] = column_data[secondary_column.field][row[primaryField]]
            # We end up with a joined single record
            # E.g. { id: 1, firstName: 'John', lastName: 'Smith' }
            # And then we append this to the list of joined items which will be returned to the front-end
            data.append(item)

        return JsonResponse(data, safe=False)
