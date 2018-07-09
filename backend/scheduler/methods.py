from celery.task.control import revoke
from dateutil import parser
from datetime import datetime, timezone, timedelta

from .tasks import instantiate_periodic_task, remove_periodic_task
from .utils import generate_task_name


def create_scheduled_task(task, schedule, arguments):
    ''' Creates a deferred (async) Celery task that, once called, will 
        instantiate a Celery periodic task at the given start time, with 
        the option to also destroy the task at the given end time. '''
    (task_name, task) = generate_task_name(task)

    # If the user provides a future start time, then parse it
    if 'startTime' in schedule and schedule['startTime']:
        start_time = parser.parse(schedule['startTime'])
    else:
    # Otherwise take the start time as now
        start_time = datetime.now(timezone.utc)

    async_tasks = []
    # If the user has opted to perform the task every N days
    if schedule['frequency'] == 'daily':
        time = parser.parse(schedule['time'])
        start_time = start_time.replace(hour=time.hour, minute=time.minute)

        # If the start time is in the past, then add a day to it
        if start_time < datetime.now(timezone.utc):
            start_time += timedelta(days=1)

        # Every N days is denoted by a celery beat task of type 'interval'
        start_task = instantiate_periodic_task.apply_async(
            args=(task, 'interval', task_name, schedule, arguments), eta=start_time)
        async_tasks.append(start_task.id)

    # Otherwise the user has opted to perform the task at a specific interval
    # E.g. Every Monday, or on the 1st of every month
    else:
        if start_time < datetime.now(timezone.utc):
            start_time += timedelta(days=1)

        # Specific intervals are denoted by a celery beat task of type 'crontab'
        start_task = instantiate_periodic_task.apply_async(
            args=(task, 'crontab', task_name, schedule, arguments), eta=start_time)
        async_tasks.append(start_task.id)

    if 'endTime' in schedule and schedule['endTime']:
        end_time = parser.parse(schedule['endTime'])

        end_task = remove_periodic_task.apply_async(
            args=(task_name,), eta=end_time)
        async_tasks.append(end_task.id)

    return task_name, async_tasks


def remove_scheduled_task(task_name):
    remove_periodic_task(task_name)


def remove_async_task(async_tasks):
    for task_id in async_tasks:
        revoke(task_id, terminate=True)
