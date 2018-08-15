from django_celery_beat.models import CrontabSchedule, IntervalSchedule

import os
import json
from dateutil import parser
from uuid import uuid4

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr

from ontask.settings import SMTP


def generate_task_name(task):
    task_name = task + '_' + str(uuid4())
    task = 'scheduler.tasks.' + task
    return (task_name, task)


def create_crontab(schedule):
    if type(schedule) is str:
        schedule = json.load(schedule)

    time = parser.parse(schedule['time'])

    if schedule['frequency'] == "daily":
        periodic_schedule, _ = IntervalSchedule.objects.get_or_create(
            every=int(schedule['dayFrequency']),
            period=IntervalSchedule.DAYS
        )

    elif schedule['frequency'] == 'weekly':
        periodic_schedule, _ = CrontabSchedule.objects.get_or_create(
            minute=time.minute,
            hour=time.hour,
            day_of_week=(',').join(schedule['dayOfWeek'])
        )

    elif schedule['frequency'] == 'monthly':
        periodic_schedule, _ = CrontabSchedule.objects.get_or_create(
            minute=time.minute,
            hour=time.hour,
            # TODO: use datetime for this instead?
            day_of_month=parser.parse(schedule['dayOfMonth']).day
        )

    return periodic_schedule


def send_email(recipient, subject, content, reply_to=None):
    '''Generic service to send email from the application'''

    if os.environ.get('ONTASK_DEMO') is not None:
        raise Exception("Email sending is disabled in the demo")

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        if 'NAME' in SMTP:
            msg['From'] = formataddr((str(Header(SMTP['NAME'], 'utf-8')), SMTP['USER']))
        else:
            msg['From'] = SMTP['USER']
        msg['To'] = recipient
        if reply_to:
            msg['Reply-To'] = reply_to

        msg.attach(MIMEText(content, 'html'))

        s = smtplib.SMTP(host=SMTP['HOST'], port=SMTP['PORT'])
        if SMTP['USE_TLS']:
            s.starttls()

        s.login(SMTP['USER'], SMTP['PASSWORD'])
        s.sendmail(SMTP['USER'], recipient, msg.as_string())
        s.quit()
        return True

    except Exception as err:
        print(err)
        raise Exception("Error sending email")
