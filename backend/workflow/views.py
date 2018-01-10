from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route

from django.http import JsonResponse
import json
from bson.json_util import dumps

from .serializers import WorkflowSerializer
from .models import Workflow
from .permissions import WorkflowPermissions

from action.models import Action

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


class WorkflowViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = WorkflowSerializer
    permission_classes = [WorkflowPermissions]

    # TO DO: make this filter based on permissions
    def get_queryset(self):
        return Workflow.objects.all()

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)
        serializer.save()

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())
        serializer.save()

    @detail_route(methods=['put'])
    def define_matrix(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        serializer = WorkflowSerializer(instance=workflow, data={'matrix': request.data}, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse(serializer.data)

    @detail_route(methods=['get'])
    def get_matrix_data(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        data = combine_data(workflow.matrix)
        return JsonResponse(data, safe=False)
    
    @detail_route(methods=['get'])
    def retrieve_workflow(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)
        
        # Convert the workflow to a python dict
        workflow = json.loads(workflow.to_json())
        # Convert the actions to a list of python dicts and add it as a key to the workflow dict
        workflow['actions'] = json.loads(Action.objects.filter(workflow = id).to_json())

        return JsonResponse(workflow, safe=False)