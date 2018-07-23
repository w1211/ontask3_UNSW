from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route, list_route
from rest_framework.permissions import IsAuthenticated

from django.http import JsonResponse
import os
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

from datasource.models import Datasource
from audit.models import Audit
from audit.serializers import AuditSerializer
from datalab.models import Datalab

from collections import defaultdict

from django.conf import settings

from scheduler.methods import (
    create_scheduled_task,
    remove_scheduled_task,
    remove_async_task,
)
from scheduler.utils import send_email
from .utils import *


class WorkflowViewSet(viewsets.ModelViewSet):
    lookup_field = "id"
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated, WorkflowPermissions]

    def get_queryset(self):
        request_user = self.request.user.email

        pipeline = [
            {
                "$lookup": {
                    "from": "container",
                    "localField": "container",
                    "foreignField": "_id",
                    "as": "container",
                }
            },
            {
                "$match": {
                    "$or": [
                        {"container.owner": request_user},
                        {"container.sharing": {"$in": [request_user]}},
                    ]
                }
            },
        ]
        workflows = list(Workflow.objects.aggregate(*pipeline))
        return Workflow.objects.filter(
            id__in=[workflow["_id"] for workflow in workflows]
        )

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)
        serializer.save()

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())
        serializer.save()

    def perform_destroy(self, obj):
        self.check_object_permissions(self.request, obj)
        self.delete_schedule(self.request, obj.id)
        obj.delete()

    @detail_route(methods=["get"])
    def retrieve_workflow(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        serializer = RetrieveWorkflowSerializer(instance=workflow)

        datasources = Datasource.objects(container=workflow.container.id).only(
            "id", "name", "fields"
        )
        serializer.instance.datasources = datasources

        # if serializer.data['schedule']:
        #     serializer.data['schedule']['startDate'] = dateutil.parser.parse(serializer.data['schedule']['startDate']).strftime('%Y-%m-%d')
        #     serializer.data['schedule']['endDate'] = dateutil.parser.parse(serializer.data['schedule']['endDate']).strftime('%Y-%m-%d')
        #     serializer.data['schedule']['time'] = dateutil.parser.parse(serializer.data['schedule']['time']).strftime('%H:%M')
        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=["put"])
    def update_filter(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        updated_filter = self.request.data
        updated_filter["name"] = "filter"

        fields = []
        for step in workflow.datalab.steps:
            if step.type == "datasource":
                step = step.datasource
                for field in step.fields:
                    fields.append(step.labels[field])

        # Validate the filter
        if "formulas" in updated_filter:
            for formula in updated_filter["formulas"]:
                # Parse the output of the field/operator cascader from the condition group form in the frontend
                # Only necessary if this is being called after a post from the frontend
                if "fieldOperator" in formula:
                    formula["field"] = formula["fieldOperator"][0]
                    formula["operator"] = formula["fieldOperator"][1]
                    del formula["fieldOperator"]

                if formula["field"] not in fields:
                    raise ValidationError(
                        f'Invalid formula: field \'{formula["field"]}\' does not exist in the DataLab'
                    )

            # Filter the data to store the number of records
            filtered_data = evaluate_filter(workflow["datalab"]["data"], updated_filter)
            workflow.filtered_count = len(filtered_data)
        else:
            workflow.filtered_count = 0

        # Update the filter
        serializer = WorkflowSerializer(
            instance=workflow, data={"filter": updated_filter}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["put"])
    def create_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        new_condition_group = self.request.data

        # Ensure that the condition group name is unique in the workflow
        # Also ensure that each condition name is unique
        for condition_group in workflow["conditionGroups"]:
            if condition_group["name"] == new_condition_group["name"]:
                raise ValidationError(
                    "'{0}' is already being used as a condition group name in this workflow".format(
                        condition_group["name"]
                    )
                )
            for condition in condition_group["conditions"]:
                if condition["name"] in [
                    condition["name"] for condition in new_condition_group["conditions"]
                ]:
                    raise ValidationError(
                        "'{0}' is already being used as a condition name in this workflow".format(
                            condition["name"]
                        )
                    )

        validate_condition_group(
            workflow.datalab.steps, workflow.datalab.data, new_condition_group
        )

        result = workflow.update(push__conditionGroups=new_condition_group)

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["put"])
    def update_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        updated_condition_group = self.request.data
        original_name = updated_condition_group["originalName"]

        # Ensure that the condition group name is unique in this workflow
        # This only has to be checked if the updated name is different than the original name
        if updated_condition_group["name"] != original_name:
            for condition_group in workflow["conditionGroups"]:
                if condition_group["name"] == updated_condition_group["name"]:
                    raise ValidationError(
                        "A condition group already exists with this name in the workflow"
                    )

        # Ensure that each condition name is unique in this workflow
        for condition_group in workflow["conditionGroups"]:
            # Skip unique check on the condition group being updated
            if condition_group["name"] == original_name:
                continue
            for condition in condition_group["conditions"]:
                if condition["name"] in [
                    condition["name"]
                    for condition in updated_condition_group["conditions"]
                ]:
                    raise ValidationError(
                        "'{0}' is already being used as a condition name in this workflow".format(
                            condition["name"]
                        )
                    )

        validate_condition_group(
            workflow.datalab.steps, workflow.datalab.data, updated_condition_group
        )

        condition_groups = workflow["conditionGroups"]
        for i in range(len(condition_groups)):
            if condition_groups[i]["name"] == original_name:
                condition_groups[i] = updated_condition_group
            else:
                condition_groups[i] = json.loads(condition_groups[i].to_json())

        # Update the condition group
        serializer = WorkflowSerializer(
            instance=workflow, data={"conditionGroups": condition_groups}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["put"])
    def delete_condition_group(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        index = self.request.data["index"]
        condition_groups = workflow["conditionGroups"]
        del condition_groups[index]

        for i in range(len(condition_groups)):
            condition_groups[i] = json.loads(condition_groups[i].to_json())

        # Update the condition group
        serializer = WorkflowSerializer(
            instance=workflow, data={"conditionGroups": condition_groups}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["put"])
    def preview_content(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        content = self.request.data["blockMap"]
        html = self.request.data["html"]

        populated_content = populate_content(
            workflow.datalab, workflow.filter, workflow.conditionGroups, content, html
        )

        return JsonResponse({"populated_content": populated_content})

    @detail_route(methods=["put"])
    def update_content(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        content = self.request.data["blockMap"]
        html = self.request.data["html"]

        # Run the populate content function to validate the provided content before saving it
        populate_content(
            workflow.datalab, workflow.filter, workflow.conditionGroups, content, html
        )

        serializer = WorkflowSerializer(
            instance=workflow, data={"content": content, "html": html}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return self.retrieve_workflow(request, id=id)


    # retrive email sending history and generate static page.
    @detail_route(methods=["get"])
    def retrieve_history(self, request, id=None):
        pipeline = [
            {"$match": {"$and": [{"creator": request.user.email}, {"workflowId": id}]}}
        ]

        def json_serial(obj):
            if isinstance(obj, (datetime, date)):
                return obj.strftime("%T %Y/%m/%d")
            if isinstance(obj, ObjectId):
                return str(obj)

        audits = list(Audit.objects.aggregate(*pipeline))
        response = {}
        response["data"] = None
        response["columns"] = []
        if audits:
            # will change based on which column we wish to show users
            columns = list(audits[0].keys())[2:-1]
            audits_str = str(dumps(audits, default=json_serial)).replace(
                '"_id":', '"id":'
            )
            response["data"] = json.loads(audits_str)
            response["columns"] = columns
        return JsonResponse(response, safe=False)

    # search workflow with link_id
    @list_route(methods=["post"])
    def search_workflow(self, request):
        link_id = self.request.data["link_id"]
        pipeline = [{"$match": {"linkId": link_id}}]

        workflow = list(Workflow.objects.aggregate(*pipeline))
        if len(workflow) == 0:
            return JsonResponse({"mismatch": True})
        else:
            return JsonResponse({"workflowId": str(workflow[0]["_id"])}, safe=False)

    # search specific content for studentwith link_id and student zid
    @list_route(methods=["post"])
    def search_content(self, request):
        link_id = self.request.data["link_id"]
        zid = self.request.data["zid"]
        try:
            workflow = Workflow.objects.get(linkId=link_id)
        except Workflow.DoesNotExist:
            return JsonResponse({"mismatch": True})
        content = populate_content(workflow, None, zid)
        if content:
            return JsonResponse({"content": content}, safe=False)
        else:
            return JsonResponse({"mismatch": True})

    @detail_route(methods=["patch"])
    def update_schedule(self, request, id=None):
        action = Workflow.objects.get(id=id)
        arguments = json.dumps({"workflow_id": id})

        # If a schedule already exists for this action, then delete it
        if "schedule" in action and "taskName" in action["schedule"]:
            remove_scheduled_task(action["schedule"]["taskName"])

        if "schedule" in action and "asyncTasks" in action["schedule"]:
            remove_async_task(action["schedule"]["asyncTasks"])

        action.update(unset__schedule=1)

        # create updated schedule tasks
        task_name, async_tasks = create_scheduled_task(
            "workflow_send_email", request.data, arguments
        )

        schedule = request.data
        schedule["taskName"] = task_name
        schedule["asyncTasks"] = async_tasks
        serializer = WorkflowSerializer(
            action, data={"schedule": schedule}, partial=True
        )

        serializer.is_valid()
        serializer.save()

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["patch"])
    def delete_schedule(self, request, id=None):
        workflow = Workflow.objects.get(id=id)

        # if taskName exist remove task with taskName
        if "schedule" in workflow and "taskName" in workflow["schedule"]:
            remove_scheduled_task(workflow["schedule"]["taskName"])
        # else remove async starter task
        if "schedule" in workflow and "asyncTasks" in workflow["schedule"]:
            remove_async_task(workflow["schedule"]["asyncTasks"])

        workflow.update(unset__schedule=1)

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["patch"])
    def update_email_settings(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        serializer = WorkflowSerializer(
            workflow,
            data={"emailSettings": request.data["emailSettings"]},
            partial=True,
        )
        serializer.is_valid()
        serializer.save()

        return self.retrieve_workflow(request, id=id)

    @detail_route(methods=["put"])
    def send_email(self, request, id=None):
        workflow = Workflow.objects.get(id=id)
        self.check_object_permissions(self.request, workflow)

        if os.environ.get("ONTASK_DEMO") is not None:
            raise ValidationError("Email sending is disabled in the demo")

        # reject when email content is empty or string with only spaces
        if not workflow["html"] or not workflow["html"].strip():
            raise ValidationError("Email content cannot be empty.")

        field = request.data["emailSettings"]["field"]
        subject = request.data["emailSettings"]["subject"]
        reply_to = request.data["emailSettings"]["replyTo"]

        data = evaluate_filter(workflow["datalab"]["data"], workflow["filter"])
        populated_content = populate_content(
            workflow.datalab,
            workflow.filter,
            workflow.conditionGroups,
            workflow.content,
            workflow.html,
        )

        failed_emails = False
        # if only send email once-off
        for index, item in enumerate(data):
            email_sent = send_email(item[field], subject, populated_content[index], reply_to)
            # if not email_sent:
            #     failed_emails = True
            # else:
            #     serializer = AuditSerializer(data = {
            #         'workflowId': id,
            #         'creator': self.request.user.email,
            #         # TODO: add reply-to
            #         'receiver': item[field],
            #         'emailBody': html[index],
            #         'emailSubject': subject
            #     })
            #     serializer.is_valid()
            #     serializer.save()
        if failed_emails:
            # TODO: Make these records identifiable, e.g. allow user to specify the primary key of the DataLab?
            # And send back a list of the specific records that we failed to send an email to
            raise ValidationError("Emails to the some records failed to send")
            # raise ValidationError('Emails to the some records failed to send: ' + str(failed_emails).strip('[]').strip("'"))
        serializer = WorkflowSerializer(
            instance=workflow,
            data={"emailSettings": request.data["emailSettings"]},
            partial=True,
        )

        serializer.is_valid()
        serializer.save()
        return JsonResponse({"success": "true"}, safe=False)