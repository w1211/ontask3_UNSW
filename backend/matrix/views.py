from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route
from mongoengine.queryset.visitor import Q

from django.http import JsonResponse

from .serializers import MatrixSerializer
from .models import Matrix
from datasource.models import DataSource
from container.models import Container
from .permissions import MatrixPermissions

from collections import defaultdict

def combine_data(matrix):
    # Create a dict of dicts which will hold the values for each secondary column
    # Our goal is to end up with something like:
    # column_data = {
    #   'firstName': { 1: 'John', 2: 'Frank', 3: 'Billy' },
    #   'lastName': { 1: 'Smith', 2: 'Johnson', 3: 'Sanders' },
    # }
    # I.e. User with id 1 is John Smith
    column_data = defaultdict(dict)
    
    # Group secondary columns by datasource
    secondary_column_datasource = defaultdict(list)
    for column in matrix['secondaryColumns']:
        secondary_column_datasource[column.datasource].append(column)

    for datasource, secondary_columns in secondary_column_datasource.items():
        data = datasource.data # Imported data source which was saved as a dictField in the Matrix model
        primary_is_integer = True if matrix['primaryColumn'].type == 'number' else False # Dict key for secondary column is string or integer dependant on the primary field type
        for row in data:
            for column in secondary_columns:
                # Each secondary column is represented by a dict in the column_data defaultdict
                # Add key-value pair of the form { matching_column_value: field_value } to the secondary column dict
                # E.g. { 1: 'John' } in the case of { id: firstName }
                try:
                    matching_column_value = int(row[column.matchesWith]) if primary_is_integer else str(row[column.matchesWith]) # E.g. "id" of 1
                    field_name = column.field # E.g. "firstName"
                    field_value = row[field_name] # E.g. John
                    column_data[field_name][matching_column_value] = field_value
                except KeyError:
                    raise ValidationError('The matching column for \'{0}\' is incorrectly configured'.format(column.field))

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
            try:
                # E.g. item['firstName'] = column_data['firstName'][1] gets the firstName of user with id 1
                item[secondary_column.field] = column_data[secondary_column.field][row[primaryField]]
            except KeyError:
                raise ValidationError('The \'type\' of the primary column is incorrectly configured')
        # We end up with a joined single record
        # E.g. { id: 1, firstName: 'John', lastName: 'Smith' }
        # And then we append this to the list of joined items which will be returned to the front-end
        data.append(item)
    
    return data

class MatrixViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = MatrixSerializer
    permission_classes = [MatrixPermissions]

    def get_queryset(self):
        # Find any containers that the user is owner of, or has readOnly or readWrite access to
        containers_with_access = Container.objects.filter(
            Q(owner = self.request.user.id) | Q(sharing__readOnly__contains = self.request.user.id) | Q(sharing__readWrite__contains = self.request.user.id) 
        )
        # Return matrices that belong to the containers found
        return Matrix.objects.filter(
            container__in = containers_with_access
        )

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
        self.check_object_permissions(self.request, self.get_object())
        queryset = Matrix.objects.filter(
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

    def perform_destroy(self, obj):
         # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, obj)
        obj.delete()

    @detail_route(methods=['get'])
    def get_data(self, request, id=None):
        matrix = Matrix.objects.get(id=id)
        self.check_object_permissions(self.request, matrix)

        data = combine_data(matrix)
        return JsonResponse(data, safe=False)
