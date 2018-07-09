from celery import shared_task
from celery.execute import send_task
from django_celery_beat.models import PeriodicTask

from pymongo import MongoClient
from bson.objectid import ObjectId
import json
from datetime import datetime

from datasource.utils import retrieve_sql_data, retrieve_file_from_s3
from workflow.utils import evaluate_filter, populate_content
from .utils import create_crontab, send_email

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
def refresh_datasource_data(datasource_id):
    ''' Reads the query data from the external source and
        inserts the data into the datasource '''

    # Retrieve the datasource object from the application database
    client = MongoClient(NOSQL_DATABASE['HOST'])
    db = client[NOSQL_DATABASE['DB']]

    # Project only the connection details of the datasource, and exclude all other fields
    datasource = db.datasource.find_one(
        {'_id': ObjectId(datasource_id)}, {'connection': 1})

    connection = datasource['connection']

    # Retrieve the query data based on the datasource type
    datasource_type = connection['dbType']
    if datasource_type in ['mysql', 'postgresql']:
        data = retrieve_sql_data(connection)
    elif datasource_type == 's3BucketFile':
        data = retrieve_file_from_s3(connection)

    fields = list(data[0].keys())

    db.datasource.update({'_id': ObjectId(datasource_id)}, {
        '$set': {
            'data': data,
            'fields': fields,
            'lastUpdated': datetime.utcnow()
        }
    })

    return 'Data imported successfully'


@shared_task
def workflow_send_email(workflow_id):
    ''' send email based on the schedule in workflow model '''

    # Retrieve the workflow object from the application database
    client = MongoClient(NOSQL_DATABASE['HOST'])
    db = client[NOSQL_DATABASE['DB']]

    workflow = db.workflow.find_one({'_id': ObjectId(workflow_id)})

    field = workflow['emailSettings']['field']
    subject = workflow['emailSettings']['subject']
    reply_to = workflow['emailSettings']['replyTo']

    workflow['view'] = db.view.find_one({'_id': ObjectId(workflow['view'])})

    html = list(value for key, value in populate_content(
        workflow, workflow['content']['html']).items())
    data = evaluate_filter(workflow['view'], workflow['filter'])

    # primary_key = view['columns'][0]['field']
    # failed_emails = list()

    for index, item in enumerate(data):
        email_sent = send_email(item[field], subject, html[index], reply_to)
        print("sending email to %s" % item[field])
    return 'Email sent successfully'
