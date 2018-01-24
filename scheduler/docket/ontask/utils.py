from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL

def read_data_from_external_database(connection, query):
    ''' Reads data from an external database based 
        on the connection details and the raw SQL
        query passed as parameters'''
    # Initialize the DB connection parameters dictionary
    db_connection_parameters = {'drivername': connection['driver'],\
                             'username': connection['username'],\
                             'password': connection['password'],\
                             'host': connection['host'],\
                             'port': connection['port']}
    # SQL alchemy code to add connect to the external
    # DB generically to access the query data
    engine = create_engine(URL(**db_connection_parameters))
    conn = engine.connect()
    query_result_set = conn.execute(query)
    conn.close()
    return query_result_set

def create_data_source_container(connection, query_results, owner):
    ''' Creates a document for the data imported from 
        an external data source '''
    data = []
    for row in query_results:
        dictionary = dict(zip(row.keys(),row))
        data.append(dictionary)
    data = [dict(zip(row.keys(),row)) for row in results]
    data_source = {'owner' : owner,\
                   'connection': connection,\
                   'data': data}
    # Save to collection
    
    