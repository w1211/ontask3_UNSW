from rest_framework_mongoengine import serializers
from mongoengine.fields import IntField

from .models import Workflow
from datasource.serializers import DatasourceSerializer
from datalab.serializers import DatalabSerializer

class RetrieveWorkflowSerializer(serializers.DocumentSerializer):
    datasources = DatasourceSerializer(many=True, allow_null=True, read_only=True)	
    datalab = DatalabSerializer(read_only=True)

    class Meta:
        model = Workflow
        fields = "__all__"
        depth = 2

class WorkflowSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Workflow
        fields = "__all__"
