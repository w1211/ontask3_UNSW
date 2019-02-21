from django.shortcuts import render
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser

from .serializers import *


User = get_user_model()


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def ChangeGroup(request, pk):
    try:
        user = User.objects.get(id=pk)
    except:
        raise NotFound()

    group = request.data.get("group")
    user.groups.set([Group.objects.get(name=group)])

    user.is_staff = group == "admin"

    user.save()

    return Response(status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def ListUsers(request):
    users = User.objects.all()

    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginated_users = paginator.paginate_queryset(users, request)

    serializer = UserSerializer(paginated_users, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def SearchUsers(request):
    user_query = request.GET.get("q", "")
    if not len(user_query) > 0:
        raise ValidationError("Invalid query")

    # Case insensitive query against user
    users = User.objects.filter(
        Q(first_name__icontains=user_query)
        | Q(last_name__icontains=user_query)
        | Q(email__icontains=user_query)
        | Q(groups__name__icontains=user_query)
    )

    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
