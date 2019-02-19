from django.shortcuts import render
from django.db.models import Q
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.contrib.postgres.search import SearchVector
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.contrib.auth.models import Group
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination
from .serializers import *


ADMIN_GROUP = "admin"
INSTRUCTOR_GROUP = "instructor"
USER_GROUP = "user"


User = get_user_model()


@api_view(["POST"])
@permission_classes([IsAdminUser])
def change_group(request, pk):

    if not request.user.groups.filter(name=ADMIN_GROUP):
        return Response({"message": "You are not authorized to change user groups"}, 401)

    new_group = request.data.get("group_name")
    user = User.objects.get(id=pk)
    user_groups = user.groups.values_list("name", flat=True)

    if ADMIN_GROUP in user_groups:
        # target user is an admin
        if new_group == ADMIN_GROUP:
            return Response({"message": "User is already an admin and can create containers"}, 200)
        # user is getting demoted, replace admin group with new_group and is_staff=True
        admin_group = Group.objects.get(name=ADMIN_GROUP)
        user.groups.remove(admin_group)
        user.is_staff = False
        user.save()
        new_group = Group.objects.get(name=new_group)
        user.groups.add(new_group)
        return Response({"message": "User group changed."}, status=status.HTTP_200_OK)

    # user is either an instructor or a user
    # if user is an instructor, change user group and remove instructor group
    elif INSTRUCTOR_GROUP in user_groups:
        instructor_group = Group.objects.get(name=INSTRUCTOR_GROUP)
        user.groups.remove(instructor_group)
        if new_group == ADMIN_GROUP:
            user.is_staff = True
            user.save()
        new_group = Group.objects.get(name=new_group)
        user.groups.add(new_group)
        return Response({"message": "User group changed."}, status=status.HTTP_200_OK)

    else:
        # user is only user
        new_group = Group.objects.get(name=new_group)
        user.groups.add(new_group)
        return Response({"message": "User group changed."}, status=status.HTTP_200_OK)
    return Response({"message": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)


class UsersList(views.APIView):
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        users = User.objects.all()
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_users = paginator.paginate_queryset(users, request)
        serializer = UserSerializer(paginated_users, many=True)
        return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def search_users(request):
    user_query = request.GET.get("q", "")
    if not len(user_query) > 0:
        raise ValidationError("Invalid query")
    # Case insensitive query against user
    users = User.objects.filter(Q(name__icontains=user_query) | 
                                Q(email__icontains=user_query) | 
                                Q(groups__name__icontains=user_query))
    serializer = UserSerializer(set(users), many=True)
    return Response(serializer.data)
