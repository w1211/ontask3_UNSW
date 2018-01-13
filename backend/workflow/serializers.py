from rest_framework_mongoengine import serializers

from .models import Workflow
from action.serializers import ActionSerializer
from datasource.serializers import DataSourceSerializer

class WorkflowSerializer(serializers.DocumentSerializer):
    actions = ActionSerializer(many=True, allow_null=True)
    datasources = DataSourceSerializer(many=True, allow_null=True)

    class Meta:
        model = Workflow
        fields = '__all__'