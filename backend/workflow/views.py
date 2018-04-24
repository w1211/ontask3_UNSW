from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route, list_route
from rest_framework.permissions import IsAuthenticated

from django.http import JsonResponse
import json
import re
import dateutil.parser
import requests
from json import dumps
from datetime import date, datetime
from bson import ObjectId

from .serializers import WorkflowSerializer, RetrieveWorkflowSerializer
from .models import Workflow
from .permissions import WorkflowPermissions

from datasource.models import DataSource
from audit.models import Audit
from audit.serializers import AuditSerializer
from view.models import View

from collections import defaultdict

from django.conf import settings

from scheduler.backend_utils import send_email, create_scheduled_task, remove_scheduled_task
from .utils import *


class WorkflowViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated, WorkflowPermissions]

    def get_queryset(self):
        pipeline = [
            {
                '$lookup': {
                    'from': 'container',
                    'localField': 'container',
                    'foreignField': '_id',
                    'as': 'container'
                }
            }, {
                '$unwind': '$container'
            }, {
                '$match': {
                    'container.owner': self.request.user.id
                }
            }
        ]
        workflows = list(Workflow.objects.aggregate(*pipeline))
        return Workflow.objects.filter(id__in = [workflow['_id'] for workflow in workflows])

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)
        serializer.save()

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())
        serializer.save()

    @detail_route(methods=['get'])
    def retrieve_workflow(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        serializer = RetrieveWorkflowSerializer(instance=workflow)

        datasources = DataSource.objects(container=workflow.container.id).only('id', 'name', 'fields')
        serializer.instance.datasources = datasources

        # if serializer.data['schedule']:
        #     serializer.data['schedule']['startDate'] = dateutil.parser.parse(serializer.data['schedule']['startDate']).strftime('%Y-%m-%d')
        #     serializer.data['schedule']['endDate'] = dateutil.parser.parse(serializer.data['schedule']['endDate']).strftime('%Y-%m-%d')
        #     serializer.data['schedule']['time'] = dateutil.parser.parse(serializer.data['schedule']['time']).strftime('%H:%M')
        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def update_filter(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        updated_filter = self.request.data
        updated_filter['name'] = 'filter'

        fields = [column['label'] if column['label'] else column['field'] for column in workflow.view.columns]

        # Validate the filter
        if 'formulas' in updated_filter:
            for formula in updated_filter['formulas']:
                # Parse the output of the field/operator cascader from the condition group form in the frontend
                # Only necessary if this is being called after a post from the frontend
                if 'fieldOperator' in formula:
                    formula['field'] = formula['fieldOperator'][0]
                    formula['operator'] = formula['fieldOperator'][1]
                    del formula['fieldOperator']

                if formula['field'] not in fields:
                    raise ValidationError(f'Invalid formula: field \'{formula["field"]}\' does not exist in the view')

            # Filter the data to store the number of records
            filtered_data = evaluate_filter(workflow.view, updated_filter)
            workflow.filtered_count = len(filtered_data)
        else:
            workflow.filtered_count = 0

        # Update the filter
        serializer = WorkflowSerializer(instance=workflow, data={'filter': updated_filter}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def create_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        new_condition_group = self.request.data

        # Ensure that the condition group name is unique in the workflow
        # Also ensure that each condition name is unique
        for condition_group in workflow['conditionGroups']:
            if condition_group['name'] == new_condition_group['name']:
                raise ValidationError('\'{0}\' is already being used as a condition group name in this workflow'.format(condition_group['name']))
            for condition in condition_group['conditions']:
                if condition['name'] in [condition['name'] for condition in new_condition_group['conditions']]:
                    raise ValidationError('\'{0}\' is already being used as a condition name in this workflow'.format(condition['name']))

        self.validate_condition_group(workflow, new_condition_group)

        result = workflow.update(push__conditionGroups=new_condition_group)

        return JsonResponse(result, safe=False)

    @detail_route(methods=['put'])
    def update_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        updated_condition_group = self.request.data
        original_name = updated_condition_group['originalName']

        # Ensure that the condition group name is unique in this workflow
        # This only has to be checked if the updated name is different than the original name
        if updated_condition_group['name'] != original_name:
            for condition_group in workflow['conditionGroups']:
                if condition_group['name'] == updated_condition_group['name']:
                    raise ValidationError('A condition group already exists with this name in the workflow')

        # Ensure that each condition name is unique in this workflow
        for condition_group in workflow['conditionGroups']:
            # Skip unique check on the condition group being updated
            if condition_group['name'] == original_name:
                continue
            for condition in condition_group['conditions']:
                if condition['name'] in [condition['name'] for condition in updated_condition_group['conditions']]:
                    raise ValidationError('\'{0}\' is already being used as a condition name in this workflow'.format(condition['name']))

        self.validate_condition_group(workflow, updated_condition_group)

        condition_groups = workflow['conditionGroups']
        for i in range(len(condition_groups)):
            if condition_groups[i]['name'] == original_name:
                condition_groups[i] = updated_condition_group
            else:
                condition_groups[i] = json.loads(condition_groups[i].to_json())

        # Update the condition group
        serializer = WorkflowSerializer(instance=workflow, data={'conditionGroups': condition_groups}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def delete_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        index = self.request.data['index']
        condition_groups = workflow['conditionGroups']
        del condition_groups[index]

        for i in range(len(condition_groups)):
            condition_groups[i] = json.loads(condition_groups[i].to_json())

        # Update the condition group
        serializer = WorkflowSerializer(instance=workflow, data={'conditionGroups': condition_groups}, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def preview_content(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        preview_content = self.request.data['html']

        populated_content = list(value for key, value in populate_content(workflow, preview_content).items())

        return JsonResponse(populated_content, safe=False)

    @detail_route(methods=['put'])
    def update_content(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)
        # print("request")
        # print(request.data)
        # updated_content = defaultdict(str)
        # updated_content["emailSubject"] = request.data['emailSubject']
        # updated_content["emailColum"] = request.data['emailColum']
        # updated_email_content = request.data['emailContent']

        # Run the populate content function to validate the provided content before saving it
        # updated_email_content = updated_email_content.replace('"', "'")
        # self.populate_content(workflow, updated_email_content)
        # updated_content["emailContent"] = updated_email_content

        updated_content = self.request.data
        # Replace double quotation marks in the html content as they will cause issues when JSONifying the workflow
        updated_content['html'] = updated_content['html'].replace('"', "'")

        # Run the populate content function to validate the provided content before saving it
        populate_content(workflow, updated_content['plain'])

        serializer = WorkflowSerializer(instance=workflow, data={'content': updated_content}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=['put'])
    def create_schedule(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)
        updated_schedule = defaultdict(str)
        updated_schedule['startDate'] = dateutil.parser.parse(request.data['RangePicker'][0])
        updated_schedule['endDate'] = dateutil.parser.parse(request.data['RangePicker'][1])
        updated_schedule['time'] = dateutil.parser.parse(request.data['TimePicker'])
        updated_schedule['frequency'] = int(request.data['Frequency'])
        serializer = WorkflowSerializer(instance=workflow, data={'schedule': updated_schedule}, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse(serializer.data)

    @detail_route(methods=['put'])
    def delete_schedule(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)
        workflow.update(unset__schedule=1)
        serializer = WorkflowSerializer(instance=workflow)
        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def send_email(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        #reject when email content is empty or string with only spaces
        if not (workflow['content'] and workflow['content']['plain'].strip()):
            raise ValidationError('Email content can not be empty.')

        field = request.data['emailSettings']['field']
        subject = request.data['emailSettings']['subject']
        reply_to = request.data['emailSettings']['replyTo']
        
        html = list(value for key, value in populate_content(workflow, workflow['content']['html']).items())

        data = evaluate_filter(workflow.view, workflow.filter)
        primary_key = workflow.view.columns[0]['field']
        failed_emails = list()

        task_name = workflow.schedule.taskName if workflow.schedule else None

        #if schedule exists
        if workflow.schedule and not workflow.schedule.taskName:
            #if send email with schedule
            arguments = json.dumps({ "workflow_id": id })
            schedule = mongo_to_dict(workflow.schedule)
            print("here in workflow schedule")
            print(schedule)
            task_name = create_scheduled_task('workflow_send_email', schedule, arguments)
        else:
            #if only send email once-off
            for index, item in enumerate(data):
                email_sent = send_email(item[field], subject, html[index], reply_to)
                if not email_sent:
                    failed_emails.append(item[primary_key])
                else:
                    serializer = AuditSerializer(data = {
                        'workflowId': id, 
                        'creator': self.request.user.email,
                        # TODO: add reply-to
                        'receiver': item[field], 
                        'emailBody': html[index],
                        'emailSubject': subject
                    })
                    serializer.is_valid()
                    serializer.save() 
            if len(failed_emails) > 0:
                raise ValidationError('Emails to the following records failed to send: ' + str(failed_emails).strip('[]').strip("'"))
       
       #saving email settings
        serializer = WorkflowSerializer(instance=workflow, data={
            'emailSettings': request.data['emailSettings'],
            'schedule.taskName': task_name
        }, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse({ 'success': 'true' }, safe=False)

    #retrive email sending history and generate static page.
    @detail_route(methods=['get'])
    def retrieve_history(self, request, id=None):
        pipeline = [
            {
                '$match':{  
                    '$and':[ 
                        {'creator' : request.user.email},
                        {'workflowId': id} 
                    ]
                }
            }
        ]
        def json_serial(obj):
            if isinstance(obj, (datetime, date)):
                return obj.strftime('%T %Y/%m/%d')
            if isinstance(obj, ObjectId):
                return str(obj)
        audits = list(Audit.objects.aggregate(*pipeline))
        response = {}
        response['data'] = None
        response['columns'] = []  
        if audits:
            #will change based on which column we wish to show users
            columns = list(audits[0].keys())[2:-1]
            audits_str = str(dumps(audits, default=json_serial)).replace('"_id":', '"id":')
            response['data'] = json.loads(audits_str)
            response['columns'] = columns    
        return JsonResponse(response, safe=False)

    #search workflow with link_id
    @list_route(methods=['post'])
    def search_workflow(self, request):
        link_id = self.request.data['link_id']
        pipeline = [
            {
                '$match':{'linkId': link_id}
            }
        ]

        workflow = list(Workflow.objects.aggregate(*pipeline))
        if len(workflow)==0:
            return JsonResponse({'mismatch': True})
        else:
            return JsonResponse({'workflowId': str(workflow[0]['_id']) }, safe=False)

    #search specific content for studentwith link_id and student zid
    @list_route(methods=['post'])
    def search_content(self, request):
        link_id = self.request.data['link_id']
        zid = self.request.data['zid']
        try:
            workflow = Workflow.objects.get(linkId=link_id)
        except Workflow.DoesNotExist:
            return JsonResponse({'mismatch': True})
        content = populate_content(workflow, None, zid)
        if content:
            return JsonResponse({'content': content }, safe=False)
        else:
            return JsonResponse({'mismatch': True})

    #schedule realted
    @detail_route(methods=['patch'])
    def delete_schedule(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        
        if workflow['schedule']['taskName']:
            remove_scheduled_task(workflow['schedule']['taskName'])

        workflow.update(unset__schedule=1)

        return JsonResponse({ "success": True })

    @detail_route(methods=['patch'])
    def update_schedule(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        schedule = request.data
        schedule['startTime'] = request.data['dateRange'][0]
        schedule['endTime'] = request.data['dateRange'][1]

        serializer = WorkflowSerializer(workflow, data={
            'schedule': schedule
        }, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse({ "success":True }, safe=False)

    @detail_route(methods=['patch'])
    def update_email_settings(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        serializer = WorkflowSerializer(workflow, data={
            'emailSettings': request.data["emailSettings"]
        }, partial=True)
        serializer.is_valid()
        serializer.save()
        return JsonResponse({ "success":True }, safe=False)
