import datetime
import string

from bson.objectid import ObjectId
from celery import shared_task
from cryptography.fernet import Fernet
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from pymongo import MongoClient
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL

from .rules_engine.matrix import Matrix
from .rules_engine.rules import Rules

from .settings import DB_DRIVER_MAPPING, DATASOURCE_KEY
from .utils import send_email, get_s3bucket_file_data

# @shared_task
# def import_data_to_data_container(connection, query, owner):
#     ''' Reads the query data from the external database and
#         inserts the data to the application database as a 
#         new data source container '''
#     # Initialize the DB connection parameters dictionary
#     db_connection_parameters = {'drivername': connection['driver'],\
#                              'username': connection['username'],\
#                              'password': connection['password'],\
#                              'host': connection['host'],\
#                              'port': connection['port']}
#     # SQL alchemy code to add connect to the external
#     # DB generically to access the query data
#     engine = create_engine(URL(**db_connection_parameters))
#     connection = engine.connect()
#     # Stream the results from the user query
#     # The stream_results=True argument here will  eliminate the buffering of the query results
#     # The result rows are not buffered, but fetched as they're needed.
#     # Ref - http://dev.mobify.com/blog/sqlalchemy-memory-magic/
#     results = connection.execution_options(stream_results=True).execute(query)

#     data = [dict(zip(row.keys(),row)) for row in results]
#     # Build the data source object
#     data_source = {'owner' : owner,\
#                    'connection': connection,\
#                    'data': data}
#     connection.close()
#     return 'Data imported successfully '

@shared_task
def update_datasource(data_source_id):
    ''' Periodic task that updates the data in the data
        source container. The task only updates the fields
        are defined as dynamic fields for the data source 
        container '''

    try:
        # Creates a handle to the data source collection
        # TO-DO: MongoDB URL as an app config setting
        client = MongoClient('mongodb://localhost:27017/')
        db = client['ontask']
        data_source_collection = db['data_source']
        
        # Match the data source container
        # TO-DO: The data field that is attached to the data_source is 
        # of concern here since the whole of the table data is brought
        # to memory when the MongoDB collection is queried. This can
        # drastically increase memory requirements in the host server
        # Might need to rethink the model design to attach the table 
        # data as a separate collection instead of an embedded list
        data_source = data_source_collection.find_one({'_id': ObjectId(data_source_id)})
        print("################### DATA SOURCE ################################")
        print(data_source)
        print("################### DATA SOURCE ################################")

        connection = data_source['connection']

        # Variables for the DB password decryption
        # TO-DO: DATASOURCE_KEY as an app config setting
        cipher = Fernet(DATASOURCE_KEY)

        # Extract connection password from the DB entry
        password = cipher.decrypt(connection['password'].encode('utf-8')).decode('utf-8')

        # Connect to the external database using the saved 
        # connection parameters
        # Initialize the DB connection parameters dictionary
        # TO-DO: DB_DRIVER_MAPPING as an app config setting
        db_connection_parameters = {
            'drivername': DB_DRIVER_MAPPING[connection['dbType']],
            'username': connection['user'],
            'password': password,
            'host': connection['host'],
            'database':connection['database']
        }
        
        # SQL alchemy code to add connect to the external
        # DB generically to access the query data
        engine = create_engine(URL(**db_connection_parameters))
        db_connection = engine.connect()

        # Stream the results from the user query
        # The stream_results=True argument here will  eliminate the buffering of the query results
        # The result rows are not buffered, but fetched as they're needed.
        # Ref - http://dev.mobify.com/blog/sqlalchemy-memory-magic/
        results = db_connection.execution_options(stream_results=True).execute(connection['query'])

        data = [dict(zip(row.keys(),row)) for row in results]
        print("################### DATA FROM EXTERNAL TABLE ################################")
        print(data)
        print("################### DATA FROM EXTERNAL TABLE ################################")
        #get current time
        updated_timestamp = datetime.datetime.utcnow()
        #update related datasource with lastest timestamp
        data_source_collection.update({"_id":ObjectId(data_source_id)}, {"$set": {"data":data, "last_updated":updated_timestamp}})
        response_message = "Successfully updated datasource %s " %data_source_id
    except Exception as exception:
        response_message = exception   
    return response_message

        # Iterative update from each row
    #     dynamic_fields = data_source['dynamic_fields']
    #     row_count = 0
    #     for row in results:
    #         # Check if the data was updated before
    #         if 'last_updated' in data_source.keys():
    #             # This is a straighforward append to the 
    #             # dynamic data fields list. Updates the field 
    #             # data iterating over the dynamic fields alone
    #             timestamp_value = datetime.datetime.utcnow()
    #             for dynamic_field in dynamic_fields:
    #                 # Create new data with the timestamp
    #                 new_data = {'value':row[dynamic_field],'timestamp':timestamp_value}
    #                 data_source_collection.update({"_id":ObjectId(data_source_container_id)},\
    #                 {'$push': {".".join(['data',str(row_count),dynamic_field]): new_data}})
    #         else:
    #             # Initial data update after the data import when
    #             # creating the data source container in the application.
    #             # The approach is to update the current data content 
    #             # in the dynamic fields with a value-timestamp pairing
    #             # for each update. The initial data would be bound so a string
    #             # value of 'INITIAL_DATA'
    #             current_document = data_source_collection.find_one({"_id":ObjectId(data_source_container_id)},\
    #             {"data":{"$slice":[row_count,1]}})['data']
    #             print("################### CURRENT DOCUMENT ################################")
    #             print(current_document)
    #             print("################### CURRENT DOCUMENT ################################")
    #             # Check for a valid document
    #             if current_document:
    #                 for dynamic_field in dynamic_fields:
    #                     # Create new data with the timestamp and existing data value
    #                     timestamp_value = datetime.datetime.utcnow()
    #                     new_data = [{'value':current_document[0][dynamic_field],'timestamp':'INITIAL_DATA'},\
    #                     {'value':row[dynamic_field],'timestamp':timestamp_value}]
    #                     print("################### NEW DATA ################################")
    #                     print(new_data)
    #                     print("################### NEW DATA ################################")
    #                     data_source_collection.update({"_id":ObjectId(data_source_container_id)},\
    #                         {'$set': {".".join(['data',str(row_count),dynamic_field]): new_data}})
                        
    #         row_count += 1
    #     # Update the last_updated field timestamp
    #     updated_timestamp = datetime.datetime.utcnow()
    #     data_source_collection.update({"_id":ObjectId(data_source_container_id)},\
    #     {'$set':{'last_updated':updated_timestamp}})
    #     response_message = "Successfully updated %i records" %row_count
    # except Exception as exception:
    #     response_message = exception   
    # return response_message


# @shared_task
# def execute_rules(workflow_id):
#     ''' Periodic task that builds the matrix for the workflow and executes the rules
#         against the generated matrix '''
#     try:
#         # Generate the matrix for the workflow
#         import_collection = Matrix()
#         field_mapping,key_mapping = import_collection.get_collection_mapping(workflow_id)
#         print(field_mapping)
#         print(key_mapping)
#         import_collection.import_data_source()
#         import_collection.execute_map_reduce()

#         # Execute the rules against the generated matrix
#         rule_engine = Rules()
#         rule_engine.execute_rules(workflow_id)

#         response_message = "Completed execution for workflow - %s" % workflow_id
#     except Exception as exception:
#         response_message = exception

#     return response_message

@shared_task
def send_email_schedule(workflow_id):
    '''Periodic task that send email based on content generate from workflow'''
    try:
        mongo_url = 'mongodb://localhost:27017/'
        app_db_identifier = 'ontask'
        client = MongoClient(mongo_url)
        db = client[app_db_identifier]
        collection = db['workflow']

        # Match the workflow document
        # workflow = collection.find_one({'_id': ObjectId(workflow_id)})
        # hard coding email content, will generate from workflow function later
        result = send_email(
            'zLNTLada@ad.unsw.edu.au',
            "z5087544@ad.unsw.edu.au",
            "email_subject",
            "text_content",
            "<p>html_content</p>",
            "z5087544@ad.unsw.edu.au",
        )
        # Return 1 or 0 to the backend indicating whether the email was sent successfully or not
        response_message = "Completed sending email to  - %s" % "receiver"
    except Exception as exception:
        response_message = exception
    return response_message


@shared_task
def update_remote_file(datasource_id, bucket, file_name, delimiter, sheetname):
    ''' Periodic task pulling file from S3 bucket and update datasource'''
    try:
        mongo_url = 'mongodb://localhost:27017/'
        app_db_identifier = 'ontask'
        client = MongoClient(mongo_url)
        db = client[app_db_identifier]
        data_source_collection = db['data_source']
        #comman is used as separator in json when passing in arguments, use comma to avoid error
        if delimiter=="comma":
            delimiter=","
        #get data from file based on file type, implemented in get_s3bucket_file_data
        (data, fields) = get_s3bucket_file_data(bucket, file_name, delimiter, sheetname)
        #get the current time
        updated_timestamp = datetime.datetime.utcnow()
        #update related datasource with lastest timestamp
        data_source_collection.update({"_id":ObjectId(datasource_id)},\
        {"$set":{"data":data, "fields":fields, "last_updated":updated_timestamp}})
        response_message = "Completed updating for datasource - %s" % datasource_id
    except Exception as exception:
        response_message = exception
    return response_message

