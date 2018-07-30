from rest_framework import serializers
from rest_framework_mongoengine.serializers import DocumentSerializer

from .models import Workflow
from datasource.serializers import DatasourceSerializer
from datalab.serializers import DatalabSerializer

class RetrieveWorkflowSerializer(DocumentSerializer):
    datasources = DatasourceSerializer(many=True, allow_null=True, read_only=True)	
    datalab = DatalabSerializer(read_only=True)
    unfiltered_data_length = serializers.IntegerField()
    filtered_data_length = serializers.IntegerField()

    class Meta:
        model = Workflow
        fields = "__all__"
        depth = 2

class WorkflowSerializer(DocumentSerializer):
    class Meta:
        model = Workflow
        fields = "__all__"
