

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

    # Internal variables

    def generate_formula(self, formula):
        ''' Translates the workflow formula to a native MongoDB query'''
        field = '.'.join(['values',formula['field']])
        operator = comparison_operator_mapping[formula['operator']]
        value = formula['comparator']

        return { field: { operator:value } }

    def generate_grouped_formula(self,formulas,type):
        ''' Translates the condition group formulas to a grouped MongoDB query'''
        group = '$and' if type == 'and' else '$or'

        return { group : [formulas] }

    