from django.http import JsonResponse
from mongoengine.queryset.visitor import Q
from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import ContainerSerializer
from .models import Container
from .permissions import ContainerPermissions

from datasource.models import Datasource
from datalab.models import Datalab
from audit.serializers import AuditSerializer
 # The below serializer only uses fields that are relevant to datalabs
from datalab.serializers import DatasourceSerializer


class ContainerViewSet(viewsets.ModelViewSet):
    lookup_field = "id"
    serializer_class = ContainerSerializer
    permission_classes = [IsAuthenticated, ContainerPermissions]

    def get_queryset(self):
        request_user = self.request.user.email

        return Container.objects.filter(
            Q(owner=request_user) | Q(sharing__contains=request_user)
        )

    def perform_create(self, serializer):
        request_user = self.request.user.email

        # We are manually checking that the combination of (owner, code) is unique.
        # We cannot take advantage of MongoEngine's inbuilt "unique_with" attribute
        # in the Container model, because we are not sending the owner attribute in
        # the request body (rather, it is provided by the request.user).
        queryset = Container.objects.filter(
            owner=request_user, code=self.request.data["code"]
        )
        if queryset.count():
            raise ValidationError("A container with this code already exists")

        container = serializer.save(owner=request_user)

        audit = AuditSerializer(
            data={
                "model": "container",
                "document": str(container.id),
                "action": "create",
                "user": request_user,
            }
        )
        audit.is_valid()
        audit.save()

    def perform_update(self, serializer):
        container = self.get_object()
        request_user = self.request.user.email

        self.check_object_permissions(self.request, container)

        # Ensure that the owner cannot be changed by a malicious payload
        if "owner" in self.request.data:
            del self.request.data["owner"]

        # Ensure that only the owner can edit sharing permissions
        if request_user != container.owner and "sharing" in self.request.data:
            del self.request.data["sharing"]

        # If we are editing an actual container, as opposed to editing the sharing
        # permissions of a container
        if "code" in self.request.data:
            queryset = Container.objects.filter(
                # We only want to check against the documents that are not the document
                # being updated. I.e. only include objects in the filter that do not have
                # the same id as the current object. We are making use of a MongoEngine
                # query operator [field]__ne (i.e. field not equal to). Refer to
                # http://docs.mongoengine.org/guide/querying.html#query-operators for
                # more information.
                id__ne=container.id,
                owner=request_user,
                code=self.request.data["code"],
            )
            if queryset.count():
                raise ValidationError("A container with this code already exists")

        serializer.save()

        # Identify the changes made to the container
        diff = {}
        for field in container:
            old_value = container[field]
            new_value = serializer.instance[field]
            if old_value != new_value:
                diff[field] = {"from": old_value, "to": new_value}

        # If changes were detected, add a record to the audit collection
        if len(diff.keys()):
            audit = AuditSerializer(
                data={
                    "model": "container",
                    "document": str(container.id),
                    "action": "edit",
                    "user": request_user,
                    "diff": diff,
                }
            )
            audit.is_valid()
            audit.save()

    def perform_destroy(self, container):
        request_user = self.request.user.email

        self.check_object_permissions(self.request, container)

        container.delete()

        audit = AuditSerializer(
            data={
                "model": "container",
                "document": str(container.id),
                "action": "delete",
                "user": request_user,
            }
        )
        audit.is_valid()
        audit.save()
        
    @action(detail=True, methods=["post"])
    def surrender_access(self, request, id=None):
        """Revoke the requesting user's access to the given container"""
        container = Container.objects.get(id=id)

        sharing = container.sharing
        request_user = request.user.email

        if request_user in sharing:
            sharing.remove(request_user)

            container.save(sharing=sharing)

            audit = AuditSerializer(
                data={
                    "model": "container",
                    "document": str(container.id),
                    "action": "surrender_access",
                    "user": request_user,
                }
            )
            audit.is_valid()
            audit.save()

        return JsonResponse({"success": 1})

    @action(detail=True, methods=["get"])
    def datasources(self, request, id=None):
        container = self.get_object()
        self.check_object_permissions(request, container)

        datasources = Datasource.objects(container=container.id).only(
            "id", "name", "fields"
        )
        serializer = DatasourceSerializer(datasources, many=True)

        return Response(serializer.data)
