from celery import shared_task
from celery.execute import send_task
from pymongo import MongoClient

from datetime import datetime, timedelta
from bson.objectid import ObjectId

from django_celery_beat.models import PeriodicTask, IntervalSchedule
from dateutil import parser
import json
# from .rules_engine.matrix import Matrix
# from .rules_engine.rules import Rules

from .utils import retrieve_sql_data, retrieve_file_from_s3, create_crontab, generate_task_name
from ontask.settings import NOSQL_DATABASE


@shared_task
def instantiate_periodic_task(task, task_type, task_name, schedule, arguments):
    crontab = create_crontab(schedule)

    try:
        if task_type == "interval":
            periodic_task = PeriodicTask.objects.create(
                interval=crontab,
                name=task_name,
                task=task,
                kwargs=arguments
            )
            send_task(task, kwargs=json.loads(arguments))

        else:
            periodic_task = PeriodicTask.objects.create(
                crontab=crontab,
                name=task_name,
                task=task,
                kwargs=arguments
            )
            
        response_message = "Instantiated periodic task  - %s" % task_name
    except Exception as exception:
        response_message = exception
    return response_message


@shared_task
def remove_periodic_task(task_name):
    try:
        task = PeriodicTask.objects.get(name=task_name)
        task.delete()
        response_message = "Removed task  - %s" % task_name
    except Exception as exception:
        response_message = exception
    return response_message


@shared_task
def create_scheduled_task(task, schedule, arguments):
    (task_name, task) = generate_task_name(task)
    
    if 'startTime' in schedule:
        start_time = datetime.strptime(schedule['startTime'], "%Y-%m-%dT%H:%M:%SZ")
        instantiate_periodic_task.apply_async(args=(task, 'crontab', task_name, schedule, arguments), eta=start_time)
    else:
        if schedule['frequency'] == 'daily':
            start_time = datetime.strptime(schedule['time'], "%Y-%m-%dT%H:%M:%SZ")
            if start_time < datetime.utcnow():
                start_time += timedelta(days=1)
            instantiate_periodic_task.apply_async(args=(task, 'interval', task_name, schedule, arguments), eta=start_time)

        else:
            instantiate_periodic_task.apply_async(args=(task, 'crontab', task_name, schedule, arguments))

    if 'endTime' in schedule:
        end_time = datetime.strptime(schedule['endTime'], "%Y-%m-%dT%H:%M:%SZ")
        remove_periodic_task.apply_async(args=(task_name), eta=end_time)

    return task_name


@shared_task
def refresh_datasource_data(datasource_id):
    ''' Reads the query data from the external source and
        inserts the data into the datasource '''

    # Retrieve the datasource object from the application database
    client = MongoClient(NOSQL_DATABASE['HOST'])
    db = client[NOSQL_DATABASE['DB']]
    
    # Project only the connection details of the datasource, and exclude all other fields
    datasource = db.data_source.find_one({ '_id': ObjectId(datasource_id) }, { 'connection': 1 })

    connection = datasource['connection']

    # Retrieve the query data based on the datasource type
    datasource_type = connection['dbType']
    if datasource_type in ['mysql', 'postgresql']:
        data = retrieve_sql_data(connection)
    elif datasource_type == 's3BucketFile':
        data = retrieve_file_from_s3(connection)

    fields = list(data[0].keys())
    
    db.data_source.update({ '_id': ObjectId(datasource_id) }, {
        '$set': {
            'data': data,
            'fields': fields,
            'lastUpdated': datetime.utcnow()
        }
    })
    
    return 'Data imported successfully'
