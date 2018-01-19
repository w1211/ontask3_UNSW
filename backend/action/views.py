from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route
from mongoengine.queryset.visitor import Q

from django.http import JsonResponse

from .serializers import ActionSerializer
from .models import Action
from .permissions import ActionPermissions

from workflow.models import Workflow
from workflow.views import combine_data

from collections import defaultdict


class ActionViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ActionSerializer
    permission_classes = [ActionPermissions]

    # TO DO: make this filter based on permissions
    def get_queryset(self):
        return Action.objects.all()

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)
        serializer.save()

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())
        serializer.save()
        
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
                raise ValidationError('An item has matched with more than one condition in the group \'{0}\''.format(condition_group['name']))        

        return conditions_passed

    def validate_condition_group(self, action, condition_group):
        workflow = action.workflow

        matrix = workflow.matrix
        primary_column = matrix['primaryColumn']['field']
        secondary_columns = matrix['secondaryColumns']
        data = combine_data(matrix)['data']

        filter = action.filter

        # Confirm that all provided fields are defined in the matrix
        secondary_column_fields = [secondary_column.field for secondary_column in secondary_columns]
        for condition in condition_group['conditions']:
            for formula in condition['formulas']:
                # Parse the output of the field/operator cascader from the condition group form in the frontend
                formula['field'] = formula['fieldOperator'][0]
                formula['operator'] = formula['fieldOperator'][1]
                del formula['fieldOperator']
                if formula['field'] not in secondary_column_fields:
                    raise ValidationError('Invalid formula: field \'{0}\' does not exist in the matrix'.format(formula['field']))

        # Filter the data
        if filter:
            filtered_data = []
            # Filter the data
            for item in data:
                populated_formula = self.populate_fields(secondary_columns, item, filter)
                try:
                    # TO DO: consider security implications of using eval()
                    if eval(populated_formula):
                        filtered_data.append(item)
                except:
                    raise ValidationError('An issue occured while trying to evaluate the filter. Do each of the fields used in the filter formula have the correct \'type\' set?')    
        else:
            filtered_data = data

        # Determine the rows that pass each condition
        # Outputs a dict of { condition_name: [ item_1_primary_field, item_2_primary_field, ... ] }
        conditions_passed = self.evaluate_condition_group(primary_column, secondary_columns, filtered_data, condition_group)
        
        return conditions_passed

    @detail_route(methods=['put'])
    def create_condition_group(self, request, id=None):
        action = Action.objects.get(id=id)
        self.check_object_permissions(self.request, action)

        condition_group = self.request.data
        conditions_passed = self.validate_condition_group(action, condition_group) 

        print(conditions_passed)

        result = action.update(push__conditionGroups=condition_group)

        return JsonResponse(result, safe=False)

    @detail_route(methods=['put'])
    def update_condition_group(self, request, id=None):
        action = Action.objects.get(id=id)
        self.check_object_permissions(self.request, action)

        updated_condition_group = self.request.data
        conditions_passed = self.validate_condition_group(action, updated_condition_group) 
        selected_name = updated_condition_group['originalName']

        print(conditions_passed)

        condition_groups = action.conditionGroups
        for i in range(len(condition_groups)):
            if condition_groups[i]['name'] == selected_name:
                condition_groups[i] = updated_condition_group

        # Update the condition group
        serializer = ActionSerializer(instance=action, data={'conditionGroups': condition_groups}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def delete_condition_group(self, request, id=None):
        action = Action.objects.get(id=id)
        self.check_object_permissions(self.request, action)

        index = self.request.data['index']
        condition_groups = action.conditionGroups
        del condition_groups[index]

        # Update the condition group
        serializer = ActionSerializer(instance=action, data={'conditionGroups': condition_groups}, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse(serializer.data, safe=False)



        #     # Populate the content for each row
    #     for item in filtered_data:
    #         # User submits a 'content' field which contains conditional blocks, such that the content is customised for each item in the filtered data dependant on the conditions that item passes
    #         # In the content, identify each conditional block of the format: {% if condition_name %}Text{% end if %}
    #         # If the current item's primary key is in the conditions_passed for that condition, then include that block in this item's customised content
    #         # Otherwise, that block will be removed from the customised content of this item
    #         # Firstly parse any conditional blocks that use {% else %} statements
    #         conditional_content = re.sub(r'({% if (.*?) %}(.*?){% else %}(.*?){% endif %})', lambda match: match.group(3) if item[primary_column] in conditions_passed[match.group(2)] else match.group(4), content)
    #         # Secondly parse any conditional blocks that only use {% if condition_name %} without {% else %} 
    #         conditional_content = re.sub(r'({% if (.*?) %}(.*?){% endif %})', lambda match: match.group(3) if item[primary_column] in conditions_passed[match.group(2)] else '', conditional_content)
    #         # After the content is customised for this item, populate any fields that may be present in the content
    #         # i.e. populate the {{field_name}} tags
    #         populated_content = self.populate_fields(secondary_columns, item, conditional_content)
    #         print(populated_content)
        
    #     # TO DO: implement actions that consume this populated content
    #     # E.g. sending emails
        
    #     # workflow = Workflow.objects.get(id=id)
    #     # self.check_object_permissions(self.request, workflow)