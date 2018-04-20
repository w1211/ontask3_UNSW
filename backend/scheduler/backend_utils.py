from dateutil import parser

from .tasks import *

#entry point of schedule tasks
def create_scheduled_task(task, schedule, arguments):
  (task_name, task) = generate_task_name(task)
  async_tasks = []
  #if start time is given, use user given time
  if 'startTime' in schedule:
    start_time = parser.parse(schedule['startTime'])
  else:
  #else make it current date
    start_time = datetime.utcnow()

  if schedule['frequency'] == 'daily':
    #if schedule is with n days invertal, start from user give 'time'
    time=parser.parse(schedule['time'])
    start_time = start_time.replace(hour=time.hour, minute=time.minute)
    #if start time is a past time, add one day
    if start_time < datetime.utcnow():
      start_time += timedelta(days=1)
    start_task = instantiate_periodic_task.apply_async(args=(task, 'interval', task_name, schedule, arguments), eta=start_time)
    async_tasks.append(start_task.id)#TODO: fix the name to have a prefix
  else:
    #TODO: if we need to handle this here
    if start_time < datetime.utcnow():
      start_time += timedelta(days=1)
    start_task = instantiate_periodic_task.apply_async(args=(task, 'crontab', task_name, schedule, arguments),eta=start_time)
    async_tasks.append(start_task.id)
  
  if 'endTime' in schedule:
    end_time = parser.parse(schedule['endTime'])
    end_task = remove_periodic_task.apply_async(args=(task_name,), eta=end_time)
    async_tasks.append(end_task.id)

  return task_name, async_tasks

#entry point of delete a scheduled task
def remove_scheduled_task(task_name):
  remove_periodic_task(task_name)

#entry point of delete async tasks
def remove_async_task(async_tasks):
  for task_id in async_tasks:
    revoke(task_id, terminate=True)