from mongoengine import Document, fields
import re
from collections import defaultdict

def did_pass_formula(item, formula):
  operator = formula['operator']
  comparator = formula['comparator']
  value = item[formula['field']]

  if operator == '==':
      return value == comparator
  elif operator == '!=':
      return value != comparator
  elif operator == '<':
      return value < comparator
  elif operator == '<=':
      return value <= comparator
  elif operator == '>':
      return value > comparator
  elif operator == '>=':
      return value >= comparator
    
def evaluate_filter(view, filter):
  if not filter:
      return view['data']

  filtered_data = list()

  # Iterate over the rows in the data and return any rows which pass true
  for item in view['data']:
      didPass = False

      if len(filter['formulas']) == 1:
          if did_pass_formula(item, filter['formulas'][0]):
              didPass = True

      elif filter['type'] == 'and':
          pass_counts = [did_pass_formula(item, formula) for formula in filter['formulas']]
          if sum(pass_counts) == len(filter['formulas']):
              didPass = True

      elif filter['type'] == 'or':
          pass_counts = [did_pass_formula(item, formula) for formula in filter['formulas']]
          if sum(pass_counts) > 0:
              didPass = True

      if didPass:
          filtered_data.append(item)

  return filtered_data

def evaluate_condition_group(data, condition_group, primary_field):
  conditions_passed = defaultdict(list)

  # Iterate over the rows in the data and return any rows which pass true
  for item in data:
      # Ensure that each item passes the test for only one condition per condition group
      matchedCount = 0

      for condition in condition_group['conditions']:
          didPass = False

          if len(condition['formulas']) == 1:
              if did_pass_formula(item, condition['formulas'][0]):
                  didPass = True

          elif condition['type'] == 'and':
              pass_counts = [did_pass_formula(item, formula) for formula in condition['formulas']]
              if sum(pass_counts) == len(condition['formulas']):
                  didPass = True

          elif condition['type'] == 'or':
              pass_counts = [did_pass_formula(item, formula) for formula in condition['formulas']]
              if sum(pass_counts) > 0:
                  didPass = True

          if didPass:
              conditions_passed[condition['name']].append(item[primary_field])
              matchedCount += 1

      if matchedCount > 1:
          raise ValidationError('An item has matched with more than one condition in the condition group \'{0}\''.format(condition_group['name']))
  return conditions_passed

def validate_condition_group(workflow, condition_group):
  data = evaluate_filter(workflow['view'], workflow['filter'])

  # Confirm that all provided fields are defined in the workflow details
  fields = [column['label'] if column['label'] else column['field'] for column in workflow['view']['columns']]

  for condition in condition_group['conditions']:
      for formula in condition['formulas']:

          # Parse the output of the field/operator cascader from the condition group form in the frontend
          # Only necessary if this is being called after a post from the frontend
          if 'fieldOperator' in formula:
              formula['field'] = formula['fieldOperator'][0]
              formula['operator'] = formula['fieldOperator'][1]
              del formula['fieldOperator']

          if formula['field'] not in fields:
              raise ValidationError('Invalid formula: field \'{0}\' does not exist in the workflow details'.format(formula['field']))

  conditions_passed = evaluate_condition_group(data, condition_group, fields[0])

  return conditions_passed

def check_condition_match(match, all_conditions_passed, item_key):
  condition = match.group(1)
  content_value = match.group(2)

  if condition not in all_conditions_passed:
      raise ValidationError('The condition \'{0}\' does not exist in any condition group for this workflow'.format(condition))

  return content_value if item_key in all_conditions_passed[condition] else None

def populate_field(match, item):
  field = match.group(1)
  if field in item:
      return str(item[field])
  else:
      return None

def populate_content(workflow, content=None, zid=None):
  filtered_data = evaluate_filter(workflow['view'], workflow['filter'])

  condition_groups = workflow['conditionGroups']
  content = content if content else workflow['content']['plain']
  primary_key = workflow['view']['columns'][0]['field']

  all_conditions_passed = dict()
  # Combine all conditions from each condition group into a single dict
  for condition_group in condition_groups:
      conditions_passed = validate_condition_group(workflow, condition_group)
      for condition in conditions_passed:
          all_conditions_passed[condition] = conditions_passed[condition]

  result = dict()
  for item in filtered_data:
      # Parse the conditional statements
      item_key = item[primary_key]
      # Use a positive lookahead to match the expected template syntax without replacing the closing block
      # E.g. we have a template given by: {% if low_grade %} Low! {% elif high_grade %} High! {% endif %}
      # We have found a match if the snippet is enclosed between two {% %} blocks
      # However, when we are replacing/subbing the match, we don't want to replace the closing block
      # This is because the closing block of the current match could also be the opening block of the next match
      # I.e. in the example above, {% elif high_grade %} is both the closing block of the first match, and the opening block of the second match
      # However, if the closing block is {% endif %}, then we can actually replace it instead of using a lookahead
      # Because we know that in that case, there would be no further matches
      item_content = re.sub(r'{% .*? (.*?) %}(.*?)({% endif %}|(?={% .*? %}))', lambda match: check_condition_match(match, all_conditions_passed, item_key), content)
      # Populate the field tags
      item_content = re.sub(r'{{ (.*?) }}', lambda match: populate_field(match, item), item_content)
      result[item_key] = item_content

  # #generate content for specific user
  # if zid:
  #     result=''
  #     for item in data:
  #         # Parse the conditional statements
  #         item_key = item[primary_field]
  #         if item_key == zid:
  #             item_content = re.sub(r'{% .*? (.*?) %}(.*?)({% endif %}|(?={% .*? %}))', lambda match: check_condition_match(match, all_conditions_passed, item_key), content)
  #             # Populate the field tags
  #             result = re.sub(r'{{ (.*?) }}', lambda match: populate_field(match, item), item_content)
  #     #return result as a string if found otherwise return empty string
  #     return result
  # else:
  #     result = defaultdict(str)
  #     for item in data:
  #         # Parse the conditional statements
  #         item_key = item[primary_field]
  #         # Use a positive lookahead to match the expected template syntax without replacing the closing block
  #         # E.g. we have a template given by: {% if low_grade %} Low! {% elif high_grade %} High! {% endif %}
  #         # We have found a match if the snippet is enclosed between two {% %} blocks
  #         # However, when we are replacing/subbing the match, we don't want to replace the closing block
  #         # This is because the closing block of the current match could also be the opening block of the next match
  #         # I.e. in the example above, {% elif high_grade %} is both the closing block of the first match, and the opening block of the second match
  #         # However, if the closing block is {% endif %}, then we can actually replace it instead of using a lookahead
  #         # Because we know that in that case, there would be no further matches
  #         item_content = re.sub(r'{% .*? (.*?) %}(.*?)({% endif %}|(?={% .*? %}))', lambda match: check_condition_match(match, all_conditions_passed, item_key), content)
  #         # Populate the field tags
  #         item_content = re.sub(r'{{ (.*?) }}', lambda match: populate_field(match, item), item_content)
  #         result[item_key] = item_content
  return result


#helper function for converting mongo document to python dictionary
def mongo_to_dict(obj):
  return_data = []

  if obj is None:
    return None

  if isinstance(obj, Document):
    return_data.append(("id",str(obj.id)))
  for field_name in obj._fields:

    if field_name in ("id",):
      continue

    data = obj._data[field_name]
    if data == None:
      continue

    if isinstance(obj._fields[field_name], fields.ListField):
      return_data.append((field_name, list_field_to_dict(data)))
    else:
      return_data.append((field_name, mongo_to_python_type(obj._fields[field_name],data)))
  return dict(return_data)

def list_field_to_dict(list_field):

	return_data = []

	for item in list_field:
	  return_data.append(mongo_to_python_type(item,item))
	return return_data

def mongo_to_python_type(field, data):
  if isinstance(field, fields.DateTimeField):
    return str(data.isoformat())
  elif isinstance(field, fields.StringField):
    return str(data)
  elif isinstance(field, fields.IntField):
    return int(data)
  elif isinstance(field, fields.ObjectIdField):
    return str(data)
  else:
    return str(data)