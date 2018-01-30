from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route

from django.http import JsonResponse
import json
import re 

from .serializers import WorkflowSerializer
from .models import Workflow
from .permissions import WorkflowPermissions

from datasource.models import DataSource

from collections import defaultdict


def combine_data(details):
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
    if details is None:
        raise ValidationError('This is not available until the workflow details have been configured')
    
    primary_is_integer = True if details['primaryColumn'].type == 'number' else False # Dict key for secondary column is string or integer dependant on the primary field type

    for column in details['secondaryColumns']:
        secondary_column_datasource[column.datasource].append(column)

    for datasource, secondary_columns in secondary_column_datasource.items():
        data = datasource.data # Imported data source which was saved as a dictField in the Datasource model
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
                except (KeyError, ValueError):
                    raise ValidationError('The matching column for \'{0}\' is incorrectly configured'.format(column.field))

    primaryColumn = details['primaryColumn']
    primaryField = primaryColumn.field
    primaryData = primaryColumn.datasource.data
    data = []

    for row in primaryData:
        # Construct a dict which will represent a single joined record
        item = {}
        item[primaryField] = row[primaryField] # E.g. item['id'] = 1
        # Loop through the defined secondary columns and get the data for this particular record's id for each column
        for secondary_column in details['secondaryColumns']:
            try:
                # E.g. item['firstName'] = column_data['firstName'][1] gets the firstName of user with id 1
                item[secondary_column.field] = column_data[secondary_column.field][int(row[primaryField]) if primary_is_integer else str(row[primaryField])]
            except KeyError:
                raise ValidationError('The \'type\' of the primary column is incorrectly configured')
        # We end up with a joined single record
        # E.g. { id: 1, firstName: 'John', lastName: 'Smith' }
        # And then we append this to the list of joined items which will be returned to the front-end
        data.append(item)

    # Define the fields (and retain their order) to be consumed by the data table
    columns = [primaryColumn.field] + [secondary_column.field for secondary_column in details['secondaryColumns']]
    
    response = {}
    response['data'] = data
    response['columns'] = columns
    return response

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

    @detail_route(methods=['get'])
    def retrieve_workflow(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        serializer = WorkflowSerializer(instance=workflow)

        datasources = DataSource.objects(container=workflow.container.id).only('id', 'name', 'fields')
        serializer.instance.datasources = datasources

        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def update_details(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        serializer = WorkflowSerializer(instance=workflow, data={'details': request.data}, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse(serializer.data)

    @detail_route(methods=['get'])
    def get_data(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        data = combine_data(workflow.details)
        return JsonResponse(data, safe=False)

    def parse_field(self, field_name, secondary_columns, value):
        secondary_column = next((x for x in secondary_columns if x['field'] == field_name), None)
        # Enclose string values with quotation marks, otherwise simply return the number value as is
        # Still must be returned as a string, since eval() takes a string input
        if secondary_column['type'] == 'text':
            return '\'{0}\''.format(value)
        else:
            return str(value)

    def did_pass_formula(self, secondary_columns, item, formula):
        populated_formula = str(self.parse_field(formula['field'], secondary_columns, item[formula['field']]) + formula['operator'] + self.parse_field(formula['field'], secondary_columns, formula['comparator']))
        # Eval the populated formula to see if it passes for this item
        try:
            if eval(populated_formula):
                return True
        except NameError:
            raise ValidationError('An issue occured while trying to evaluate the formula. Do each of the fields used have the correct \'type\' set?')
        return False

    def evaluate_condition_group(self, primary_column, secondary_columns, data, condition_group):
        conditions_passed = defaultdict(list)

        # Iterate over the rows in the data and return any rows which pass true
        for item in data:
            # Ensure that each item passes the test for only one condition per condition group
            matchedCount = 0
           
            for condition in condition_group['conditions']:
                didPass = False

                if len(condition['formulas']) == 1:
                    if self.did_pass_formula(secondary_columns, item, condition['formulas'][0]):
                        didPass = True

                elif condition['type'] == 'and':
                    pass_counts = [self.did_pass_formula(secondary_columns, item, formula) for formula in condition['formulas']]
                    if sum(pass_counts) == len(condition['formulas']):
                        didPass = True

                elif condition['type'] == 'or':
                    pass_counts = [self.did_pass_formula(secondary_columns, item, formula) for formula in condition['formulas']]
                    if sum(pass_counts) > 0:
                        didPass = True
                
                if didPass:
                    conditions_passed[condition['name']].append(item[primary_column])
                    matchedCount += 1

            if matchedCount > 1:
                raise ValidationError('An item has matched with more than one condition in the condition group \'{0}\''.format(condition_group['name']))        

        return conditions_passed

    def validate_condition_group(self, details, condition_group):
        primary_column = details['primaryColumn']['field']
        secondary_columns = details['secondaryColumns']
        data = combine_data(details)['data']

        # Confirm that all provided fields are defined in the workflow details
        secondary_column_fields = [secondary_column.field for secondary_column in secondary_columns]
        for condition in condition_group['conditions']:
            for formula in condition['formulas']:
                
                # Parse the output of the field/operator cascader from the condition group form in the frontend
                # Only necessary if this is being called after a post from the frontend
                if 'fieldOperator' in formula:
                    formula['field'] = formula['fieldOperator'][0]
                    formula['operator'] = formula['fieldOperator'][1]
                    del formula['fieldOperator']

                if formula['field'] not in secondary_column_fields:
                    raise ValidationError('Invalid formula: field \'{0}\' does not exist in the workflow details'.format(formula['field']))

        # Filter the data
        # filter = action.filter
        # if filter:
        #     filtered_data = []
        #     # Filter the data
        #     for item in data:
        #         populated_formula = self.populate_fields(secondary_columns, item, filter)
        #         try:
        #             # TO DO: consider security implications of using eval()
        #             if eval(populated_formula):
        #                 filtered_data.append(item)
        #         except:
        #             raise ValidationError('An issue occured while trying to evaluate the filter. Do each of the fields used in the filter formula have the correct \'type\' set?')    
        #     data = filtered_data

        # Determine the rows that pass each condition
        # Outputs a dict of { condition_name: [ item_1_primary_field, item_2_primary_field, ... ] }
        conditions_passed = self.evaluate_condition_group(primary_column, secondary_columns, data, condition_group)
        
        return conditions_passed

    @detail_route(methods=['put'])
    def create_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        new_condition_group = self.request.data

        # Ensure that the condition group name is unique in the workflow
        # Also ensure that each condition name is unique
        for condition_group in workflow['conditionGroups']:
            if condition_group['name'] == new_condition_group['name']:
                raise ValidationError('\'{0}\' is already being used as a condition group name in this workflow'.format(condition_group['name']))
            for condition in condition_group['conditions']:
                if condition['name'] in [condition['name'] for condition in new_condition_group['conditions']]:
                    raise ValidationError('\'{0}\' is already being used as a condition name in this workflow'.format(condition['name']))
        
        conditions_passed = self.validate_condition_group(workflow['details'], new_condition_group) 

        result = workflow.update(push__conditionGroups=new_condition_group)

        return JsonResponse(result, safe=False)

    @detail_route(methods=['put'])
    def update_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        updated_condition_group = self.request.data
        original_name = updated_condition_group['originalName']

        # Ensure that the condition group name is unique in this workflow
        # This only has to be checked if the updated name is different than the original name
        if updated_condition_group['name'] != original_name:
            for condition_group in workflow['conditionGroups']:
                if condition_group['name'] == updated_condition_group['name']:
                    raise ValidationError('A condition group already exists with this name in the workflow')

        # Ensure that each condition name is unique in this workflow
        for condition_group in workflow['conditionGroups']:
            # Skip unique check on the condition group being updated
            if condition_group['name'] == original_name:
                continue
            for condition in condition_group['conditions']:
                if condition['name'] in [condition['name'] for condition in updated_condition_group['conditions']]:
                    raise ValidationError('\'{0}\' is already being used as a condition name in this workflow'.format(condition['name']))

        conditions_passed = self.validate_condition_group(workflow['details'], updated_condition_group) 

        condition_groups = workflow['conditionGroups']
        for i in range(len(condition_groups)):
            if condition_groups[i]['name'] == original_name:
                condition_groups[i] = updated_condition_group
            else:
                condition_groups[i] = json.loads(condition_groups[i].to_json())

        # Update the condition group
        serializer = WorkflowSerializer(instance=workflow, data={'conditionGroups': condition_groups}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def delete_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        index = self.request.data['index']
        condition_groups = workflow['conditionGroups']
        del condition_groups[index]
        
        for i in range(len(condition_groups)):
            condition_groups[i] = json.loads(condition_groups[i].to_json())

        # Update the condition group
        serializer = WorkflowSerializer(instance=workflow, data={'conditionGroups': condition_groups}, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse(serializer.data, safe=False)

    def check_condition_match(self, match, all_conditions_passed, item_key):
        # print(match.groups())
        condition = match.group(1)
        content_value = match.group(2)

        if condition not in all_conditions_passed:
            raise ValidationError('The condition \'{0}\' does not exist in any condition group for this workflow'.format(condition))
        
        return content_value if item_key in all_conditions_passed[condition] else None


    def populate_field(self, match, item):
        field = match.group(1)
        try:
            value = item[field]
        except KeyError:
            raise ValidationError('The field \'{0}\' does not exist in the details of this workflow'.format(field))

        return str(value)

    def populate_content(self, workflow, content=None):
        condition_groups = workflow['conditionGroups']
        details = workflow['details']
        all_conditions_passed = defaultdict(list)
        
        content = content if content else workflow['content']

        # Combine all conditions from each condition group into a single dict
        for condition_group in condition_groups:
            conditions_passed = self.validate_condition_group(details, condition_group)
            for condition in conditions_passed:
                all_conditions_passed[condition] = conditions_passed[condition]

        data = combine_data(details)['data']
        primary_field = details['primaryColumn']['field']

        result = defaultdict(str)
        
        for item in data:
            # Parse the conditional statements
            item_key = item[primary_field]
            # Use a positive lookahead to match the expected template syntax without replacing the closing block
            # E.g. we have a template given by: {% if low_grade %} Low! {% elif high_grade %} High! {% endif %}
            # We have found a match if the snippet is enclosed between two {% %} blocks
            # However, when we are replacing/subbing the match, we don't want to replace the closing block
            # This is because the closing block of the current match could also be the opening block of the next match
            # I.e. in the example above, {% elif high_grade %} is both the closing block of the first match, and the opening block of the second match
            # However, if the closing block is {% endif %}, then we can actually replace it instead of using a lookahead
            # Because we know that in that case, there would be no further matches
            item_content = re.sub(r'{% .*? (.*?) %}(.*?)({% endif %}|(?={% .*? %}))', lambda match: self.check_condition_match(match, all_conditions_passed, item_key), content)
            # Populate the field tags
            item_content = re.sub(r'{{ (.*?) }}', lambda match: self.populate_field(match, item), item_content)
            result[item_key] = item_content
            
        return result
    
    @detail_route(methods=['put'])
    def preview_content(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        preview_content = self.request.data

        populated_content = list(value for key, value in self.populate_content(workflow, preview_content).items())
        
        return JsonResponse(populated_content, safe=False)

    @detail_route(methods=['put'])
    def update_content(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        updated_content = self.request.data
        updated_content = updated_content.replace('"', "'")

        # Run the populate content function to validate the provided content before saving it
        self.populate_content(workflow, updated_content)

        serializer = WorkflowSerializer(instance=workflow, data={'content': updated_content}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)
