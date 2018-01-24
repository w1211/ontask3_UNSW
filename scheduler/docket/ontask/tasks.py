import string
import datetime
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL

from celery import shared_task
from pymongo import MongoClient
from bson.objectid import ObjectId
from cryptography.fernet import Fernet

from .settings import DB_DRIVER_MAPPING

@shared_task
def import_data_to_data_container(connection, query, owner):
    ''' Reads the query data from the external database and
        inserts the data to the application database as a 
        new data source container '''
    # Initialize the DB connection parameters dictionary
    db_connection_parameters = {'drivername': connection['driver'],\
                             'username': connection['username'],\
                             'password': connection['password'],\
                             'host': connection['host'],\
                             'port': connection['port']}
    # SQL alchemy code to add connect to the external
    # DB generically to access the query data
    engine = create_engine(URL(**db_connection_parameters))
    connection = engine.connect()
    # Stream the results from the user query
    # The stream_results=True argument here will  eliminate the buffering of the query results
    # The result rows are not buffered, but fetched as they're needed.
    # Ref - http://dev.mobify.com/blog/sqlalchemy-memory-magic/
    results = connection.execution_options(stream_results=True).execute(query)

    data = [dict(zip(row.keys(),row)) for row in results]
    # Build the data source object
    data_source = {'owner' : owner,\
                   'connection': connection,\
                   'data': data}
    
    connection.close()
    return 'Data imported successfully '

@shared_task
def update_data_in_data_container(data_source_container_id):
    ''' Periodic task that updates the data in the data
        source container. The task only updates the fields
        are defined as dynamic fields for the data source 
        container '''
    # Creates a handle to the data source collection
    # TO-DO: MongoDB URL as an app config setting
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ontask_api']
    data_source_collection = db['data_source']
    


    # Match the data source container
    # TO-DO: The data field that is attached to the data_source is 
    # of concern here since the whole of the table data is brought
    # to memory when the MongoDB collection is queried. This can
    # drastically increase memory requirements in the host server
    # Might need to rethink the model design to attach the table 
    # data as a separate collection instead of an embedded list
    data_source = data_source_collection.find_one({'_id': ObjectId(data_source_container_id)})

    connection = data_source['connection']

    # Variables for the DB password decryption
    # TO-DO: DATASOURCE_KEY as an app config setting
    DATASOURCE_KEY = "1B9cECfwfCg8hDPdBCgnIAdDhKAU2jAGvlWIDZAgopk="
    cipher = Fernet(DATASOURCE_KEY)

    # Extract connection password from the DB entry
    password = cipher.decrypt(connection['password'].encode('utf-8')).decode('utf-8')

    # Connect to the external database using the saved 
    # connection parameters
    # Initialize the DB connection parameters dictionary
    # TO-DO: DB_DRIVER_MAPPING as an app config setting
    db_connection_parameters = {'drivername': DB_DRIVER_MAPPING[connection['dbType']],\
                             'username': connection['user'],\
                             'password': password,\
                             'host': connection['host'],\
                             'port': connection['port'],
                             'database':connection['database']}
    
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
    print(data)
    data_source_collection.update({"_id":ObjectId("5a56e9e4f5ec4e515e781b6f")}, {'$set': {'data':data}})

    # Iterative update from each row
    dynamic_fields = data_source['dynamic_fields']
    row_count = 0
    for row in results:
        # Check if the data was updated before
        if 'last_updated' in data_source.keys():
            # This is a straighforward append to the 
            # dynamic data fields list. Updates the field 
            # data iterating over the dynamic fields alone
            timestamp_value = datetime.datetime.utcnow()
            for dynamic_field in dynamic_fields:
                # Create new data with the timestamp
                new_data = {'value':row[dynamic_field],'timestamp':timestamp_value}
                data_source_collection.update({"_id":ObjectId(data_source_container_id)},\
                 {'$push': {".".join(['data',str(row_count),dynamic_field]): new_data}})
            # Update the last_updated field timestamp
            data_source_collection.update({"_id":ObjectId(data_source_container_id)},\
            {'$set':{'last_updated':timestamp_value}})
        else:
            pass
        app_data = data_source['data'][row_count]
    
    
    return results

