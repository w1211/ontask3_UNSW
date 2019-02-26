from django.core.mail import get_connection
from celery import shared_task
from celery.execute import send_task
from django_celery_beat.models import PeriodicTask

from bson.objectid import ObjectId
import json
import jwt
import uuid
from time import sleep
from datetime import datetime as dt
import boto3
import pandas as pd
from io import StringIO
import logging

from datasource.models import Datasource
from administration.models import Dump
from datalab.models import Datalab

from .utils import create_crontab, send_email

from ontask.settings import (
    SECRET_KEY,
    BACKEND_DOMAIN,
    FRONTEND_DOMAIN,
    EMAIL_BATCH_SIZE,
    EMAIL_BATCH_PAUSE,
    AWS_PROFILE,
    DATALAB_DUMP_BUCKET,
)

logger = logging.getLogger("django")


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
def dump_datalab_data():
    from datalab.serializers import OrderItemSerializer

    dump = Dump.objects.all()
    if not len(dump) > 0:
        return "No DataLabs were marked for data dump"

    if not DATALAB_DUMP_BUCKET:
        return "No DataLab dump bucket has been specified"

    dump = dump[0]
    dump.last_run = dt.utcnow()
    dump.save()

    if AWS_PROFILE:
        session = boto3.Session(profile_name=AWS_PROFILE)
        s3 = session.resource("s3")
    else:
        s3 = boto3.resource("s3")

    for datalab in dump.datalabs:
        datalab = Datalab.objects.get(id=datalab.id)
        data = pd.DataFrame(datalab.data)
        csv_buffer = StringIO()

        # Re-order the columns to match the original datasource data
        order = OrderItemSerializer(
            datalab.order, many=True, context={"steps": datalab.steps}
        )
        reordered_columns = [item.get("label") for item in order.data]
        data = data.reindex(columns=reordered_columns)

        data.to_csv(csv_buffer, index=False)
        s3.Object(
            DATALAB_DUMP_BUCKET, f"{datalab.container.code}_{datalab.name}.csv"
        ).put(Body=csv_buffer.getvalue())

    return "DataLab data dumped successfully"


@shared_task
def workflow_send_email(action_id, job_type="Scheduled"):
    """ Send email based on the schedule in workflow model """
    logger.info(f"{action_id} - Action - {job_type} email job initiated")

    from workflow.models import Workflow, EmailJob, Email

    action = Workflow.objects.get(id=ObjectId(action_id))

    populated_content = action.populate_content()
    email_settings = action.emailSettings

    job_id = ObjectId()
    job = EmailJob(
        job_id=job_id,
        subject=email_settings.subject,
        type=job_type,
        included_feedback=email_settings.include_feedback and True,
        emails=[],
    )

    successes = []
    failures = []

    messages = action.data["records"]
    batch_size = EMAIL_BATCH_SIZE if EMAIL_BATCH_SIZE else len(messages)
    batch_pause = EMAIL_BATCH_PAUSE if EMAIL_BATCH_PAUSE else 0

    email_batches = [
        messages[i : i + batch_size] for i in range(0, len(messages), batch_size)
    ]

    recipient_count = 0
    for batch_index, batch in enumerate(email_batches):
        logger.info(
            f"{action_id} - Action - Starting batch {batch_index + 1} of {len(email_batches)}"
        )

        # Open a connection to the SMTP server, which will be used for every email sent in this batch
        # It is done per batch to avoid the risk of the connection timing out if the batch_delay is long
        with get_connection() as connection:

            for index, item in enumerate(batch):
                recipient = item.get(email_settings.field)
                email_content = populated_content[recipient_count]

                email_id = uuid.uuid4().hex
                tracking_token = jwt.encode(
                    {
                        "action_id": str(action.id),
                        "job_id": str(job_id),
                        "email_id": str(email_id),
                    },
                    SECRET_KEY,
                    algorithm="HS256",
                ).decode("utf-8")

                tracking_link = (
                    f"{BACKEND_DOMAIN}/workflow/read_receipt/?email={tracking_token}"
                )
                tracking_pixel = f"<img src='{tracking_link}'/>"
                email_content += tracking_pixel

                if email_settings.include_feedback:
                    feedback_link = f"{FRONTEND_DOMAIN}/feedback/{action.id}/?job={job_id}&email={email_id}"
                    email_content += (
                        "<p>Did you find this correspondence useful? Please provide your "
                        f"feedback by <a href='{feedback_link}'>clicking here</a>.</p>"
                    )

                email_sent = send_email(
                    recipient,
                    email_settings.subject,
                    email_content,
                    from_name=email_settings.fromName,
                    reply_to=email_settings.replyTo,
                    connection=connection,
                )

                if email_sent:
                    job.emails.append(
                        Email(
                            email_id=email_id,
                            recipient=recipient,
                            # Content without the tracking pixel
                            content=populated_content[index],
                        )
                    )
                    successes.append(recipient)
                    logger.info(
                        f"{action_id} - Action - Successfully sent email to {recipient} ({recipient_count + 1} of {len(messages)})"
                    )
                else:
                    failures.append(recipient)
                    logger.info(
                        f"{action_id} - Action - Failed to send email to {recipient} ({recipient_count + 1} of {len(messages)})"
                    )

                recipient_count += 1

            if batch_index + 1 != len(email_batches) and batch_pause > 0:
                logger.info(
                    f"{action_id} - Action - End of batch reached. Waiting for {batch_pause} seconds"
                )
                sleep(batch_pause)

    action.emailJobs.append(job)

    action.save()
    if len(failures) == 0:
        send_email(
            action.container.owner,
            "Email job completed",
            f"All {len(successes)} emails were successfully sent",
        )
    else:
        failures_concat = ", ".join(failures)
        send_email(
            action.container.owner,
            "Email job completed",
            f"""
                The following {len(failures)} emails were unsuccessful: {failures_concat}
                <br><br>
                The other {len(successes)} emails were successfully sent
            """,
        )

    logger.info(
        f"{action_id} - Action - {job_type} email job completed"
    )

    return "Email job completed."
