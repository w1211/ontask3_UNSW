from rest_framework import serializers
from rest_framework_mongoengine.serializers import (
    DocumentSerializer,
    EmbeddedDocumentSerializer,
)

from .models import Container
from datasource.models import Datasource
from datalab.models import Datalab
from workflow.models import Workflow


class EmbeddedDatasourceSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = Datasource
        fields = ["id", "name", "connection", "schedule", "lastUpdated"]


class EmbeddedDatalabSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = Datalab
        fields = ["id", "name", "steps"]


class EmbeddedWorkflowSerializer(EmbeddedDocumentSerializer):
    datalab = serializers.CharField()

    class Meta:
        model = Workflow
        fields = ["id", "name", "description", "datalab"]


class ContainerSerializer(DocumentSerializer):
    datasources = EmbeddedDatasourceSerializer(
        many=True, allow_null=True, read_only=True
    )
    datalabs = EmbeddedDatalabSerializer(many=True, allow_null=True, read_only=True)
    workflows = EmbeddedWorkflowSerializer(many=True, allow_null=True, read_only=True)

    class Meta:
        model = Container
        fields = "__all__"
