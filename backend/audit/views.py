from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from mongoengine.queryset.visitor import Q
from rest_framework.decorators import list_route
from django.http import JsonResponse

import requests
import json
import re
import dateutil.parser
import requests
from .serializers import AuditSerializer
from .models import Audit
from .permissions import AuditPermissions
from json import dumps
from datetime import date, datetime
from bson import ObjectId

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
    
    #retrieve all email history for student
    @list_route(methods=['get'])
    def retrieve_history(self, request):
        #change to find?
        pipeline = [
            {
                '$match':{'receiver' : request.user.email}
            }
        ]
        def json_serial(obj):
            if isinstance(obj, (datetime, date)):
                return obj.strftime('%T %Y/%m/%d')
            if isinstance(obj, ObjectId):
                return str(obj)
        audits = list(Audit.objects.aggregate(*pipeline))
        response = {}
        response['data'] = None
        response['columns'] = []  
        if audits:
            #tmp choose what to display
            columns = list(audits[0].keys())[1:-1]
            audits_str = str(dumps(audits, default=json_serial)).replace('"_id":', '"id":')
            response['data'] = json.loads(audits_str)
            response['columns'] = columns
        return JsonResponse(response, safe=False)
        

    
