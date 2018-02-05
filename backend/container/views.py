from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import list_route

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


class ContainerViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ContainerSerializer
    permission_classes = [ContainerPermissions]

    def get_queryset(self):
        return Container.objects.filter(
            Q(owner = self.request.user.id) | Q(sharing__readOnly__contains = self.request.user.id) | Q(sharing__readWrite__contains = self.request.user.id)
        )

    @list_route(methods=['get'])
    def retrieve_containers(self, request):
        # Retrieve containers owned by or shared with the current user, including the associated workflows & data sources
        # Consumed by the containers list interface
        # Perform a lookup on each container object so that we can attach its associated workflows & data sources

        def json_serial(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            if isinstance(obj, ObjectId):
                return str(obj)

        pipeline = [
            {
                '$match': {
                    '$or': [
                        { 'owner': self.request.user.id },
                        { 'sharing.readOnly': { '$in': [self.request.user.id] } },
                        { 'sharing.readWrite': { '$in': [self.request.user.id] } }
                    ]
                }
            },
            {
                '$lookup': {
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
                # Exclude fields that are not used in the containers component
                '$project': {
                    'datasources.container': 0,
                    'datasources.data': 0,
                    'datasources.connection.password': 0,
                    'datasources.fields': 0,
                    'workflows.container': 0,
                    'workflows.conditionGroups': 0,
                    'workflows.details': 0,
                    'workflows.content': 0
                },
            }
        ]
        containers_after_dump = dumps(list(Container.objects.aggregate(*pipeline)), default=json_serial)
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
            owner = self.request.user.id,
            code = self.request.data['code']
        )
        if queryset.count():
            raise ValidationError('A container with this code already exists')
        serializer.save(owner=self.request.user.id)

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())
        queryset = Container.objects.filter(
            # We only want to check against the documents that are not the document being updated
            # I.e. only include objects in the filter that do not have the same id as the current object
            # id != self.kwargs.get(self.lookup_field) is syntactically incorrect
            # So instead we are making use of a query operator [field]__ne (i.e. field not equal to)
            # Refer to http://docs.mongoengine.org/guide/querying.html#query-operators for more information
            id__ne = self.kwargs.get(self.lookup_field), # Get the id of the object from the url route as defined by the lookup_field
            owner = self.request.user.id,
            code = self.request.data['code']
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