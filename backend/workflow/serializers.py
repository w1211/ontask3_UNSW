from rest_framework_mongoengine import serializers

from .models import Workflow
from datasource.serializers import DataSourceSerializer

class WorkflowSerializer(serializers.DocumentSerializer):
    datasources = DataSourceSerializer(many=True, allow_null=True, read_only=True)

    class Meta:
        model = Workflow
        fields = '__all__'