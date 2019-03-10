from django_celery_beat.models import CrontabSchedule, PeriodicTask
from django.core.mail import EmailMessage

import os
import json
from dateutil import parser
from uuid import uuid4
from datetime import datetime as dt
from functools import wraps

from ontask.settings import EMAIL_ALIAS, EMAIL_NAME, EMAIL_HOST_USER


def should_run(f):
    @wraps(f)
    def task(*args, **kwargs):
        from datasource.models import Datasource
        from workflow.models import Workflow

        active_from = kwargs.get("active_from")
        if active_from:
            active_from = dt.strptime(active_from, "%Y-%m-%dT%H:%M:%S.%fZ")
            if active_from > dt.utcnow():
                return "Skipping task because it is not yet active"

        active_to = kwargs.get("active_to")
        if active_to:
            active_to = dt.strptime(active_to, "%Y-%m-%dT%H:%M:%S.%fZ")
            if active_to < dt.utcnow():
                task_name = None

                if "datasource_id" in kwargs:
                    datasource = Datasource.objects.get(id=kwargs.get("datasource_id"))
                    task_name = datasource.schedule.task_name
                    datasource.update(unset__schedule=1)

                elif "action_id" in kwargs:
                    action = Workflow.objects.get(id=kwargs.get("action_id"))
                    task_name = action.schedule.task_name
                    action.update(unset__schedule=1)

                task = PeriodicTask.objects.get(name=task_name)
                task.delete()
                return "Task removed because it is no longer active"

        return f(*args, **kwargs)

    return task


def generate_task_name(task):
    task_name = task + "_" + str(uuid4())
    task = "scheduler.tasks." + task
    return (task_name, task)


def create_crontab(schedule):
    time = dt.strptime(schedule.get("time"), "%Y-%m-%dT%H:%M:%S.%fZ")
    crontab = {"hour": time.hour, "minute": time.minute}

    if schedule["frequency"] == "weekly":
        crontab["day_of_week"] = (",").join(schedule["day_of_week"])
    elif schedule["frequency"] == "monthly":
        crontab["day_of_month"] = dt.strptime(
            schedule.get("day_of_month"), "%Y-%m-%dT%H:%M:%S.%fZ"
        ).day

    crontab, _ = CrontabSchedule.objects.get_or_create(**crontab)

    return crontab


def create_task(task, schedule, arguments={}):
    (task_name, task) = generate_task_name(task)
    crontab = create_crontab(schedule)

    arguments["active_from"] = schedule.get("active_from")
    arguments["active_to"] = schedule.get("active_to")

    PeriodicTask.objects.create(
        crontab=crontab, name=task_name, task=task, kwargs=json.dumps(arguments)
    )

    return task_name


def delete_task(task_name):
    task = PeriodicTask.objects.get(name=task_name)
    task.delete()


def send_email(
    recipient,
    subject,
    content,
    from_name=None,
    from_email=None,
    reply_to=None,
    force_send=False,
    connection=None,
):
    """Generic service to send email from the application"""

    if not force_send and os.environ.get("ONTASK_DEMO"):
        raise Exception("Email sending is disabled in the demo")

    from_name = from_name if from_name else EMAIL_NAME
    if not from_email:
        from_email = EMAIL_ALIAS if EMAIL_ALIAS else EMAIL_HOST_USER

    if from_name:
        from_email = f"{from_name} <{from_email}>"

    # If a batch of emails are being sent, then use the provided connection
    # Rather than opening a connection for each email sent in the batch
    # Refer to https://docs.djangoproject.com/en/2.1/topics/email/#email-backends
    email = EmailMessage(
        subject, content, from_email, [recipient], connection=connection
    )

    email.content_subtype = "html"

    if reply_to:
        email.reply_to = [reply_to]

    email.send()
    return True
