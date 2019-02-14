from rest_framework import serializers
from rest_framework_mongoengine.serializers import (
    DocumentSerializer,
    EmbeddedDocumentSerializer,
)
from mongoengine.queryset.visitor import Q

from .models import Container
from datasource.models import Datasource
from datalab.models import Datalab, Module, DatasourceModule
from workflow.models import Workflow
from form.models import Form


class ContainerSerializer(DocumentSerializer):
    class Meta:
        model = Container
        fields = "__all__"


class DatasourceSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = Datasource
        fields = ["id", "name", "connection", "schedule", "lastUpdated", "fields"]


class DatasourceModuleSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = DatasourceModule
        fields = ["id"]


class FormSerializer(DocumentSerializer):
    class Meta:
        model = Form
        fields = ["name", "data"]


class ModuleSerializer(EmbeddedDocumentSerializer):
    datasource = DatasourceModuleSerializer()
    form = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ["type", "datasource", "form"]

    def get_form(self, module):
        return (
            FormSerializer(Form.objects.get(id=module.form)).data
            if "form" in module
            else None
        )


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


class InformationSubmissionSerializer(DocumentSerializer):
    class Meta:
        model = Form
        fields = ["id", "name", "description"]


class DashboardSerializer(DocumentSerializer):
    has_full_permission = serializers.SerializerMethodField()
    datasources = serializers.SerializerMethodField()
    datalabs = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    information_submission = serializers.SerializerMethodField()

    def get_has_full_permission(self, container):
        return self.context.get("has_full_permission", False)

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

    def get_information_submission(self, container):
        if self.context.get("has_full_permission"):
            forms = Form.objects.filter(
                Q(container=container) & (Q(ltiAccess=True) | Q(emailAccess=True))
            )
        else:
            forms = [
                form
                for form in self.context.get("accessible_forms")
                if form.container == container
            ]

        serializer = InformationSubmissionSerializer(forms, many=True)
        return serializer.data

    def __init__(self, *args, **kwargs):
        super(DashboardSerializer, self).__init__(*args, **kwargs)

        if not self.context.get("has_full_permission"):
            allowed_fields = ["id", "code", "has_full_permission",  "information_submission"]
            for field in set(self.fields) - set(allowed_fields):
                self.fields.pop(field)

    class Meta:
        model = Container
        fields = "__all__"
