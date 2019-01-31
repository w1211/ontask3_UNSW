from rest_framework import serializers
from rest_framework_mongoengine.serializers import (
    DocumentSerializer,
    EmbeddedDocumentSerializer,
)

from .models import Container
from datasource.models import Datasource
from datalab.models import Datalab, Module, DatasourceModule, FormModule
from workflow.models import Workflow


class DatasourceSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = Datasource
        fields = ["id", "name", "connection", "schedule", "lastUpdated"]

class DatasourceModuleSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = DatasourceModule
        fields = ["id"]

class FormModuleSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = FormModule
        fields = ["name"]

class ModuleSerializer(EmbeddedDocumentSerializer):
    datasource = DatasourceModuleSerializer()
    form = FormModuleSerializer()

    class Meta:
        model = Module
        fields = ["type", "datasource", "form"]

class DatalabSerializer(EmbeddedDocumentSerializer):
    steps = ModuleSerializer(many=True)

    class Meta:
        model = Datalab
        fields = ["id", "name", "steps"]


class ActionSerializer(EmbeddedDocumentSerializer):
    datalab = serializers.CharField()

    class Meta:
        model = Workflow
        fields = ["id", "name", "description", "datalab"]


class ContainerSerializer(DocumentSerializer):
    datasources = serializers.SerializerMethodField()
    datalabs = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()

    def get_datasources(self, container):
        datasources = Datasource.objects(container=container.id)
        serializer = DatasourceSerializer(datasources, many=True)
        return serializer.data

    def get_datalabs(self, container):
        datalabs = Datalab.objects(container=container.id)
        serializer = DatalabSerializer(datalabs, many=True)
        return serializer.data

    def get_actions(self, container):
        actions = Workflow.objects(container=container.id)

        for action in actions:
            action.datalab = action.datalab.name

        serializer = ActionSerializer(actions, many=True)
        return serializer.data

    class Meta:
        model = Container
        fields = "__all__"
