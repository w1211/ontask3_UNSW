from rest_framework_mongoengine import serializers

from .models import Container
from datasource.models import Datasource
from datalab.models import Datalab
from workflow.models import Workflow


class EmbeddedDatasourceSerializer(serializers.EmbeddedDocumentSerializer):
    class Meta:
        model = Datasource
        fields = ['id', 'name', 'connection', 'schedule', 'lastUpdated']


class EmbeddedDatalabSerializer(serializers.EmbeddedDocumentSerializer):
    class Meta:
        model = Datalab
        fields = ['id', 'name', 'steps']


class EmbeddedWorkflowSerializer(serializers.EmbeddedDocumentSerializer):
    class Meta:
        model = Workflow
        fields = ['id', 'name', 'description']


class ContainerSerializer(serializers.DocumentSerializer):
    datasources = EmbeddedDatasourceSerializer(
        many=True, allow_null=True, read_only=True)
    datalabs = EmbeddedDatalabSerializer(
        many=True, allow_null=True, read_only=True)
    workflows = EmbeddedWorkflowSerializer(
        many=True, allow_null=True, read_only=True)

    class Meta:
        model = Container
        fields = '__all__'
