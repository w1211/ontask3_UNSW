from django_celery_beat.models import CrontabSchedule, IntervalSchedule
from django.core.mail import EmailMessage

import os
import json
from dateutil import parser
from uuid import uuid4

from ontask.settings import EMAIL_ALIAS, EMAIL_NAME


def generate_task_name(task):
    task_name = task + "_" + str(uuid4())
    task = "scheduler.tasks." + task
    return (task_name, task)


def create_crontab(schedule):
    if type(schedule) is str:
        schedule = json.load(schedule)

    time = parser.parse(schedule["time"])

    if schedule["frequency"] == "daily":
        periodic_schedule, _ = IntervalSchedule.objects.get_or_create(
            every=int(schedule["dayFrequency"]), period=IntervalSchedule.DAYS
        )

    elif schedule["frequency"] == "weekly":
        periodic_schedule, _ = CrontabSchedule.objects.get_or_create(
            minute=time.minute,
            hour=time.hour,
            day_of_week=(",").join(schedule["dayOfWeek"]),
        )

    elif schedule["frequency"] == "monthly":
        periodic_schedule, _ = CrontabSchedule.objects.get_or_create(
            minute=time.minute,
            hour=time.hour,
            # TODO: use datetime for this instead?
            day_of_month=parser.parse(schedule["dayOfMonth"]).day,
        )

    return periodic_schedule


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
