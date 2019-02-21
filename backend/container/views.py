from mongoengine.queryset.visitor import Q
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rest_framework.status import HTTP_201_CREATED, HTTP_200_OK

from .serializers import ContainerSerializer, DashboardSerializer
from .models import Container

from form.models import Form
from accounts.permissions import CanCreateObjects


@api_view(["GET"])
def Dashboard(request):
        accessible_forms = Form.objects.filter(
            (Q(ltiAccess=True) | Q(emailAccess=True))
            & Q(permitted_users__in=request.user.permission_values)
        )
        related_containers = set(form.container.id for form in accessible_forms)

        containers = Container.objects.filter(
            Q(owner=request.user.email)
            | Q(sharing__contains=request.user.email)
            | Q(id__in=related_containers)
        )

        response = []
        for container in containers:
            serializer = DashboardSerializer(
                container,
                context={
                    "has_full_permission": container.has_full_permission(request.user),
                    "accessible_forms": accessible_forms,
                },
            )
            response.append(serializer.data)

        return Response(response)


@api_view(["POST"])
@permission_classes([CanCreateObjects])
def CreateContainer(request):
        # Ensure that the container code is not a duplicate for this user
        if Container.objects.filter(
            owner=request.user.email, code=request.data["code"]
        ).first():
            raise ValidationError("A container with this code already exists")

        container = Container(owner=request.user.email)
        serializer = ContainerSerializer(container, data=request.data)
        serializer.is_valid()
        serializer.save()

        return Response(serializer.data, status=HTTP_201_CREATED)


class DetailContainer(APIView):
    def patch(self, request, id):
        try:
            container = Container.objects.get(id=id)
        except:
            raise NotFound()

        # Only owner or users with shared access can edit a container
        if not container.has_full_permission(request.user):
            raise PermissionDenied()

        # Ensure that the owner cannot be changed by a malicious payload
        if "owner" in request.data:
            del request.data["owner"]

        # Ensure that only the owner can edit sharing permissions
        if request.user.email != container.owner and "sharing" in request.data:
            del request.data["sharing"]

        # Ensure that the container code is not a duplicate for this user
        if "code" in request.data:
            if Container.objects.filter(
                id__ne=container.id, owner=request.user.email, code=request.data["code"]
            ).first():
                raise ValidationError("A container with this code already exists")

        serializer = ContainerSerializer(container, data=request.data, partial=True)
        serializer.is_valid()
        serializer.save()

        return Response(status=HTTP_200_OK)

    def delete(self, request, id):
        try:
            container = Container.objects.get(id=id)
        except:
            raise NotFound()

        # Only owner can delete a container
        if not container.is_owner(request.user):
            raise PermissionDenied()

        container.delete()

        return Response(status=HTTP_200_OK)


@api_view(["POST"])
def SurrenderAccess(request, id):
    try:
        container = Container.objects.get(id=id)
    except:
        raise NotFound()

    if request.user.email in container.sharing:
        container.sharing.remove(request.user.email)
        container.save()

    return Response(status=HTTP_200_OK)
