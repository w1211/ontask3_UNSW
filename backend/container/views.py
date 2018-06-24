from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import detail_route, list_route, permission_classes
from rest_framework.permissions import IsAuthenticated

from django.http import JsonResponse
import json
import re
from bson import ObjectId
from datetime import date, datetime
from json import dumps
from mongoengine.queryset.visitor import Q

from .serializers import ContainerSerializer
from .models import Container
from .permissions import ContainerPermissions

from datasource.models import DataSource
from scheduler.backend_utils import mongo_to_dict

from workflow.models import Workflow


class ContainerViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ContainerSerializer
    permission_classes = [ContainerPermissions, IsAuthenticated]

    def json_serial(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)

    def get_queryset(self):
        request_user = self.request.user.email
        return Container.objects.filter(
            Q(owner=request_user) | Q(sharing__contains=request_user)
        )

    @list_route(methods=['get'])
    def retrieve_containers(self, request):
        request_user = self.request.user.email

        # Retrieve containers owned by or shared with the current user, including the associated workflows & data sources
        # Consumed by the containers list interface
        # Perform a lookup on each container object so that we can attach its associated workflows & data sources
        pipeline = [
            {
                '$match': {
                    '$or': [
                        {'owner': request_user},
                        {'sharing': {'$in': [request_user]}}
                    ]
                }
            },
            {
                '$lookup': {
                    # The collection name in MongoDB for datasources is data_source
                    # When using a DRF serializer, as we do in the backend, DRF handles this mapping for us
                    # Given that we are interfacing directly with MongoDB in this aggregate lookup, we must use the correct collection name
                    'from': 'data_source',
                    'localField': '_id',
                    'foreignField': 'container',
                    'as': 'datasources'
                }
            },
            {
                '$lookup': {
                    'from': 'workflow',
                    'localField': '_id',
                    'foreignField': 'container',
                    'as': 'workflows'
                }
            },
            {
                '$lookup': {
                    'from': 'view',
                    'localField': '_id',
                    'foreignField': 'container',
                    'as': 'views'
                }
            },
            {
                # Exclude fields that are not used in the containers component
                '$project': {
                    'datasources.container': 0,
                    'datasources.connection.password': 0,
                    'workflows.container': 0,
                    'workflows.conditionGroups': 0,
                    'workflows.details': 0,
                    'workflows.content': 0,
                    'view.container': 0
                }
            }
        ]
        containers_after_query = list(Container.objects.aggregate(*pipeline))

        containers_after_dump = dumps(containers_after_query, default=self.json_serial)

        # Convert the queryset response into a string so that we can transform
        # To remove the underscore from "id" key values
        # For better consistency in field names
        containers = str(containers_after_dump).replace('"_id":', '"id":')
        return JsonResponse(json.loads(containers), safe=False)

    def perform_create(self, serializer):
        # We are manually checking that the combination of (owner, code) is unique
        # We cannot take advantage of MongoEngine's inbuilt "unique_with" attribute in the Container model
        # Because we are not sending the owner attribute in the request body (rather, it is provided by the request.user)
        queryset = Container.objects.filter(
            owner=self.request.user.email,
            code=self.request.data['code']
        )
        if queryset.count():
            raise ValidationError('A container with this code already exists')
        serializer.save(owner=self.request.user.email)

    def perform_update(self, serializer):
        container = self.get_object()
        self.check_object_permissions(self.request, container)

        # Ensure that the owner cannot be changed by a malicious payload
        if 'owner' in self.request.data:
            del self.request.data['owner']

        # Ensure that only the owner can edit sharing permissions
        if self.request.user.email != container.owner and 'sharing' in self.request.data:
            del self.request.data['sharing']

        # If we are editing an actual container, as opposed to editing the sharing permissions of a container
        if 'code' in self.request.data:
            queryset = Container.objects.filter(
                # We only want to check against the documents that are not the document being updated
                # I.e. only include objects in the filter that do not have the same id as the current object
                # id != self.kwargs.get(self.lookup_field) is syntactically incorrect
                # So instead we are making use of a query operator [field]__ne (i.e. field not equal to)
                # Refer to http://docs.mongoengine.org/guide/querying.html#query-operators for more information
                # Get the id of the object from the url route as defined by the lookup_field
                id__ne=self.kwargs.get(self.lookup_field),
                owner=self.request.user.email,
                code=self.request.data['code']
            )
            if queryset.count():
                raise ValidationError('A container with this code already exists')

        serializer.save()

    def perform_destroy(self, obj):
         # Ensure that the request.user is the owner of the object
        self.check_object_permissions(self.request, obj)

        # The delete function cascades down datasources & matrices
        # This is done via the container field of the datasource & workflow models
        obj.delete()

        # TODO fix bug https://stackoverflow.com/questions/32513388/how-would-i-override-the-perform-destroy-method-in-django-rest-framework

    # retrieve all workflows owned by current user
    @list_route(methods=['get'])
    def retrieve_workflows(self, request):
        pipeline = [
            {
                '$match': {
                    '$or': [
                        {'owner': self.request.user.id}
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'workflow',
                    'localField': '_id',
                    'foreignField': 'container',
                    'as': 'workflows'
                }
            },
            {
                # Exclude fields that are not used in the containers component
                '$project': {
                    'workflows.container': 0,
                    'workflows.conditionGroups': 0,
                    'workflows.details': 0,
                    'workflows.content': 0
                },
            }
        ]
        containers_after_dump = dumps(list(Container.objects.aggregate(*pipeline)), default=self.json_serial)
        # Convert the queryset response into a string so that we can transform
        # To remove the underscore from "id" key values
        # For better consistency in field names
        containers = str(containers_after_dump).replace('"_id":', '"id":')
        return JsonResponse(json.loads(containers), safe=False)

    @detail_route(methods=['get'])
    def retrieve_datasources(self, request, id=None):
        '''Retrieve all datasources associated with the given container'''
        container = Container.objects.get(id=id)
        self.check_object_permissions(self.request, container)

        datasources = DataSource.objects(container=id).only('id', 'name', 'fields', 'data')
        for datasource in datasources:
            datasource['data'] = datasource['data'][:1]
        datasources = [mongo_to_dict(datasource) for datasource in datasources]

        return JsonResponse(datasources, safe=False)

    @detail_route(methods=['get'])
    def retrieve_workflows(self, request, id=None):
        '''Retrieve all workflows associated with the given container'''
        container = Container.objects.get(id=id)
        self.check_object_permissions(self.request, container)

        workflows = Workflow.objects(container=id).only('id', 'name')

        workflows = [mongo_to_dict(workflow) for workflow in workflows]

        return JsonResponse(workflows, safe=False)

    @detail_route(methods=['post'])
    def surrender_access(self, request, id=None):
        '''Revoke the requesting user's access to the given container'''
        container = Container.objects.get(id=id)

        sharing = container.sharing
        user = request.user.email

        if user in sharing:
            sharing.remove(request.user.email)


        container.save(sharing=sharing)

        return JsonResponse({"success": True})
