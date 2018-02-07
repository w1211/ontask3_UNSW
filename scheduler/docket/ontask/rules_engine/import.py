from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.code import Code
from bson.son import SON
from collections import defaultdict

class Matrix:
    ''' Helper class that assists the Rules processing job to create the rules matrix '''

    # Internal Variables
    field_mapping = defaultdict(list) # Groups fields in a single data source
    key_mapping   = defaultdict(list) # Maps the keys of a data source
    primary_key   = ""
    workflow_id   = ""

    # Config Variables
    mongo_url                   =  'mongodb://localhost:27017/'
    app_db_identifier           =  'ontask_api'
    data_db_identifier          =  'ontask_data'
    matrix_identifier           =  'matrix'
    primary_column_identifier   =  'primaryColumn'
    secondary_column_identifier =  'secondaryColumns'

    # Map-Reduce variables
    reduce_function = "" # Variable for the reduce function

    def get_collection_mapping(self, workflow_id):
        ''' Generates a list of fields and the keys alingned to a matrix indexed with the data source id'''
        # STEP 1 - Create a hash table to map the fields to the data source id's
        # The function generates a grouping of the data sources involved in the matrix and 
        # assigns them to the dictionaries

        # Assign the workflow_id of the object
        self.workflow_id = workflow_id

        # App DB connection
        client = MongoClient(self.mongo_url)
        db = client[self.app_db_identifier]
        collection = db['workflow']

        # Match the workflow document
        workflow = collection.find_one({'_id': ObjectId(workflow_id)})

        # Map the primary column value
        primary_datasource = str(workflow[self.matrix_identifier][self.primary_column_identifier]['datasource'])
        primary_field = workflow[self.matrix_identifier][self.primary_column_identifier]['field']
        primary_key = primary_field
        self.field_mapping[primary_datasource].append(primary_field)
        self.key_mapping[primary_datasource] = primary_key
        self.primary_key = primary_key

        # Map the secondary column value
        for column in workflow[self.matrix_identifier][self.secondary_column_identifier]:
            datasource = str(column['datasource'])
            self.field_mapping[datasource].append(column['field'])
            if datasource != primary_datasource:
                self.field_mapping[datasource].append(column['matchesWith'])
            self.key_mapping[datasource] = column['matchesWith']

        # Closes MongoClient connection
        client.close()

        return self.field_mapping, self.key_mapping

    def import_data_source(self):
        ''' Imports filtered data from the source data containers to the data collections'''
        # STEP 2 - Import data from the data source collections into the map reduce collections
        # The intention here is to create independent collections that store the data imported from 
        # the external databases inordered to run the MongoDB mapreduce jobs on them

        client = MongoClient(self.mongo_url)
        # App DB connection
        app_db = client[self.app_db_identifier]
        app_collection = app_db['data_source']

        # Data DB connection
        data_db = client[self.data_db_identifier]
        
        # Perform collection import
        for id, mapping in self.field_mapping.items():
            data_array  = app_collection.find_one({'_id':ObjectId(id)}, { '.'.join(["data",field]):1 for field in mapping })['data']
            data_collection = data_db[id]
            data_collection.insert(data_array)
        
        client.close()

    def generate_map_function(self,data_source_id):
        ''' Generates a map function based on the data source id '''
        # STEP 3 - Generate map functions for each of the imported data sources so emit a 
        # pair of the key and field values

        # Initializes the key and value variables
        key = self.key_mapping[data_source_id]
        value = {field:'.'.join(['this',field]) for field in self.field_mapping[data_source_id]}

        # Generates the Map function string
        map_function_template = '''
                                    function() {
                                        // TO-DO: RULES TO VALIDATE THE MAPPING?
                                        var key = this.%s.toString();
                                        var value = %s;
                                        // Simply emit the key and the rest of the fields
                                        emit(key, value);
                                    }
                                '''%(key, str(value).replace("'",""))

        mapper = Code(map_function_template)
        return mapper

    def generate_reduce_function(self):
        ''' Generates the reduce fucntion for the collection merge '''
        # STEP 3 - Generate the reduce function to properly merge the imported data sources
        # into a single collection

        reduce_function_template = '''
                                        function(key, values) {
                                            var result_object = {};

                                            values.forEach(function(value) {
                                                // Combine the object properties in a single object variable
                                                for(var attribute_name in value){
                                                    result_object[attribute_name] = value[attribute_name];
                                                }
                                            });

                                            return result_object;
                                        }
                                    '''
        self.reduce_function = Code(reduce_function_template)
        
    def execute_map_reduce(self):
        '''Executes the map reduce job '''
        # STEP 4 - Run the Map-Reduce jobs to combine the collections

        # DB connection
        client = MongoClient(self.mongo_url)
        db = client[self.data_db_identifier]

        # Generate the reduce function
        self.generate_reduce_function()

        # Run the jobs
        for data_source_id, mapping in self.field_mapping.items():
            function_handle = self.generate_map_function(data_source_id)
            db[data_source_id].map_reduce(function_handle, self.reduce_function, \
            out=SON([("reduce", '_'.join(['matrix', self.workflow_id])), ("db", self.data_db_identifier)]))


if __name__ == '__main__':
    import_collection = Matrix()
    field_mapping,key_mapping = import_collection.get_collection_mapping('5a56e9ecf5ec4e515e781b70')
    print(field_mapping)
    print(key_mapping)
    import_collection.import_data_source()
    import_collection.execute_map_reduce()




