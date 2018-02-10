from django.contrib.auth.models import User
from django.contrib import messages
from django.views.generic import TemplateView
from django.views.generic.list import ListView
from django.views.generic.edit import FormView
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from django_celery_beat.models import CrontabSchedule, PeriodicTask
from uuid import uuid4

from .forms import GenerateRandomUserForm
from .tasks import update_data_in_data_container




class DataSourceUpdateTaskView(APIView):
    ''' Container for the Data source update'''
    # Assigns the authentication permissions
    authentication_classes = ()
    permission_classes = ()
    
    def post(self, request, format=None):
        '''Post handle to create a schedule'''

        task_name = "data_source_update_task_" + str(uuid4())
        arguments= '{"data_source_container_id":"' + request.data['data_source_container_id'] + '"}'
        
        schedule, _ = CrontabSchedule.objects.get_or_create(
            minute = request.data['schedule']['minute'],
            hour = request.data['schedule']['hour'],
            day_of_week = request.data['schedule']['day_of_week'],
            day_of_month = request.data['schedule']['day_of_month'],
            month_of_year = request.data['schedule']['month_of_year'],
        )

        periodic_task = PeriodicTask.objects.create(
           crontab=schedule,
           name=task_name,
           task='ontask.tasks.update_data_in_data_container',
           kwargs=arguments
        )

        print("################ {Periodic Task} ###################")
        print(periodic_task)

        return Response({'task_name': task_name})
    
    def delete(self, request, format=None):
        '''DELETE handle to remove a scheduler from the beat schedule'''
        print(self.request.data)
        task = PeriodicTask.objects.get(name=request.data['name'])
        print(task)
        task.delete()

        return Response({'task_name':task.name,'message':'Periodic task deleted'})

class WorkflowTaskView(APIView):
    ''' Container for the Rules execution task scheduler '''
    # Assigns the authentication permissions
    authentication_classes = ()
    permission_classes = ()
    
    def post(self, request, format=None):
        '''Post handle to create a schedule'''

        task_name = "workflow_notification_task_" + str(uuid4())
        arguments= '{"workflow_id":"' + request.data['workflow_id'] + '"}'
        
        schedule, _ = CrontabSchedule.objects.get_or_create(
            minute = request.data['schedule']['minute'],
            hour = request.data['schedule']['hour'],
            day_of_week = request.data['schedule']['day_of_week'],
            day_of_month = request.data['schedule']['day_of_month'],
            month_of_year = request.data['schedule']['month_of_year'],
        )

        periodic_task = PeriodicTask.objects.create(
           crontab=schedule,
           name=task_name,
           task='ontask.tasks.execute_rules',
           kwargs=arguments
        )

        print("################ {Periodic Task} ###################")
        print(periodic_task)

        return Response({'task_name': task_name})
    
    def delete(self, request, format=None):
        '''DELETE handle to remove a scheduler from the beat schedule'''
        print(self.request.data)
        task = PeriodicTask.objects.get(name=request.data['name'])
        print(task)
        task.delete()

        return Response({'task_name':task.name,'message':'Periodic task deleted'})



