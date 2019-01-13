from celery import shared_task
from celery.execute import send_task
from django_celery_beat.models import PeriodicTask

from pymongo import MongoClient
from bson.objectid import ObjectId
import json
from datetime import datetime

from datasource.models import Datasource
# from datasource.utils import retrieve_sql_data, retrieve_file_from_s3
from workflow.models import Workflow
from .utils import create_crontab, send_email

from ontask.settings import NOSQL_DATABASE


@shared_task
def instantiate_periodic_task(task, task_type, task_name, schedule, arguments):
    crontab = create_crontab(schedule)

    try:
        if task_type == "interval":
            periodic_task = PeriodicTask.objects.create(
                interval=crontab, name=task_name, task=task, kwargs=arguments
            )
            send_task(task, kwargs=json.loads(arguments))

        else:
            periodic_task = PeriodicTask.objects.create(
                crontab=crontab, name=task_name, task=task, kwargs=arguments
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
    """ Reads the query data from the external source and
        inserts the data into the datasource """
    datasource = Datasource.objects.get(id=ObjectId(datasource_id))
    datasource.refresh_data()

    return "Data imported successfully"


@shared_task
def workflow_send_email(action_id):
    """ Send email based on the schedule in workflow model """
    action = Workflow.objects.get(id=ObjectId(action_id))
    action.send_email("Scheduled")

    return "Emails sent successfully"
