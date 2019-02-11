from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.contrib.auth.models import User, Group


ADMIN_GROUP = "admin"
INSTRUCTOR_GROUP = "instructor"


User = get_user_model()

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_admin(request, pk):
    group = request.data.get("group_name")
    user = User.objects.get(id=pk)
    add_group = Group.objects.get(name=group)
    user.groups.add(add_group)
    if group == ADMIN_GROUP:
        user.is_staff = True
        user.save()
    return Response({"message": "User added to group."}, status=status.HTTP_200_OK)
    
