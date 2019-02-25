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
from rest_framework.views import APIView
from bson import ObjectId
from datetime import datetime as dt, timedelta

from .serializers import *
from .models import *
from datalab.models import Datalab
from scheduler.methods import (
    create_scheduled_task,
    remove_scheduled_task,
    remove_async_task,
)
from scheduler.tasks import dump_datalab_data

from collections import defaultdict

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
    users = list(User.objects.all())

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


class DataLabDump(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, format=None):
        datalabs = Datalab.objects.all()

        containers = defaultdict(list)
        for datalab in datalabs:
            containers[datalab.container.code].append(
                {"id": str(datalab.id), "name": datalab.name}
            )

        dump = Dump.objects.all()
        last_run = None
        scheduled = False
        if len(dump) > 0:
            last_run = dump[0].last_run
            scheduled  = bool(dump[0].task_name)
            dump = [str(datalab.id) for datalab in dump[0].datalabs]
        else:
            dump = []

        return Response(
            {
                "containers": containers,
                "dump": dump,
                "last_run": last_run,
                "scheduled": scheduled,
            }
        )

    def put(self, request, format=None):
        datalabs = [ObjectId(datalab) for datalab in request.data.get("datalabs", [])]
        scheduled = request.data.get("scheduled")

        dump = Dump.objects.all()
        if len(dump) > 0:
            dump = dump[0]
            dump.datalabs = datalabs
        else:
            dump = Dump(datalabs=datalabs)

        dump.save()

        if scheduled and not dump.task_name:
            schedule = {
                "dayFrequency": 1,
                "frequency": "daily",
                "time": dt.utcnow()
                .replace(hour=21, minute=0)
                .strftime("%Y-%m-%d %H:%M:%S"),
            }
            task_name, async_tasks = create_scheduled_task(
                "dump_datalab_data", schedule, ""
            )
            dump.task_name = task_name
            dump.async_tasks = async_tasks
            dump.save()
        elif not scheduled and dump.task_name:
            remove_scheduled_task(dump.task_name)
            remove_async_task(dump.async_tasks)
            dump.task_name = None
            dump.async_tasks = []
            dump.save()

        is_force = request.query_params.get("force")
        if is_force:
            dump_datalab_data.delay()

        return Response()
