from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.son import SON

import re


comparison_operator_mapping = {
    '<'  : '$lt',
    '<=' : '$lte',
    '>'  : '$gt',
    '>=' : '$gte',
    '==' : '$eq',
    '!=' : '$neq'
}

class Rules:
    ''' Class contains the methods to run the rules against the generated matrix and sent out emails'''

    # Config variables
    mongo_url                   =  'mongodb://localhost:27017/'
    app_db_identifier           =  'ontask_api'
    data_db_identifier          =  'ontask_data'


    def is_float(self, s):
        ''' Check for floating point numbers - better than a regex check: 
            https://stackoverflow.com/questions/354038/how-do-i-check-if-a-string-is-a-number-float'''
        try:
            float(s)
            return True
        except ValueError:
            return False

    def generate_formula(self, formula):
        ''' Translates the workflow formula to a native MongoDB query'''
        field = '.'.join(['value',formula['field']])
        operator = comparison_operator_mapping[formula['operator']]

        # Value conversion and mapping
        # Tries a float conversion first and then a integer value mapping
        value = formula['comparator']
        value = float(value) if self.is_float(value) else value
        value = int(value) if str(value).isdigit() else value

        return { field: { operator:value } }

    def generate_grouped_formula(self,formulas,type):
        ''' Translates the condition group formulas to a grouped MongoDB query'''
        group = '$and' if type == 'and' else '$or'

        return { group : formulas }

    def check_condition_match(self, match, mapped_condition):
        condition = match.group(1)
        # print("##### CODN #####")
        # print(condition)
        # print("##### CODN #####")
        content_value = match.group(2)
        return content_value if mapped_condition == condition else None
    
    def populate_field(self, match, item):
        field = match.group(1)

        try:
            value = item[field]
        except KeyError:
            raise ValidationError('The field \'{0}\' does not exist in the details of this workflow'.format(field))

        return str(value)
    
    def retrieve_matching_docs(self, query, workflow_id, content, condition):
        ''' Retrieve the matching documents from the matrix collection '''
        client = MongoClient(self.mongo_url)
        db = client[self.data_db_identifier]
        collection = db['_'.join(['matrix', workflow_id])]

        data = collection.find(query)

        for item in data:
            # print("############ ITEM ###################")
            # print(item)
            # print("############ ITEM ###################")
            item_content = re.sub(r'{% .*? (.*?) %}(.*?)({% endif %}|(?={% .*? %}))',\
             lambda match: self.check_condition_match(match, condition), content)
            # print("############ ITEM CONTENT1 ###################")
            # print(item_content)
            # print("############ ITEM CONTENT1 ###################")
            item_content = re.sub(r'{{ (.*?) }}', lambda match: self.populate_field(match, item['value']), item_content)
            # print("############ ITEM CONTENT2 ###################")
            print(item_content)
            # print("############ ITEM CONTENT2 ###################")
        client.close()

    def execute_rules(self, workflow_id):
        ''' Builds the query for each condition in the workflow and runs them'''

        # App DB connection
        client = MongoClient(self.mongo_url)
        db = client[self.app_db_identifier]
        collection = db['workflow']

        # Map the condition values
        workflow = collection.find_one({'_id':ObjectId(workflow_id)})
        conditions = workflow['conditionGroups']
        content = workflow['content']

        for condition in conditions:
            print('Executing condition ---- %s'%condition['name'])
            for sub_condition in condition['conditions']:
                sub_condition_name = sub_condition['name']
                formulas = [self.generate_formula(formula) for formula in sub_condition['formulas']]
                query = SON(self.generate_grouped_formula(formulas, sub_condition['type']))
                print(query)
                self.retrieve_matching_docs(query, workflow_id, content, sub_condition_name)
        
        client.close()
        
def main():
    rule_engine = Rules()
    rule_engine.execute_rules('5a56e9ecf5ec4e515e781b70')

if __name__ == '__main__':
    main()

