from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from mongoengine.queryset.visitor import Q

from django.http import JsonResponse

import requests

from .serializers import AuditSerializer
from .models import Audit
from .permissions import AuditPermissions

from collections import defaultdict

from django.conf import settings

class AuditViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = AuditSerializer
    permission_classes = [AuditPermissions]

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)
        serializer.save()

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())
        serializer.save()
    
    def get_queryset(self):
        #double check if need to be modified
        return Audit.objects.filter(
            Q(owner = self.request.user.id) | Q(sharing__readOnly__contains = self.request.user.id) | Q(sharing__readWrite__contains = self.request.user.id)
        )
    
