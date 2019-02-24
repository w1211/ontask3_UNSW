from rest_framework import serializers
from rest_framework_mongoengine.serializers import (
    DocumentSerializer,
    EmbeddedDocumentSerializer,
)

from .models import Datalab, Column
from datasource.models import Datasource
from form.models import Form
from form.serializers import FormSerializer
from workflow.models import Workflow, EmailJob, Email


class EmailSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = Email
        exclude = ["content"]


class EmailJobSerializer(EmbeddedDocumentSerializer):
    emails = EmailSerializer(many=True, allow_null=True, read_only=True)

    class Meta:
        model = EmailJob
        fields = "__all__"


class ActionSerializer(DocumentSerializer):
    emailJobs = EmailJobSerializer(many=True, allow_null=True, read_only=True)
    emailField = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = ["id", "name", "emailJobs", "emailField"]

    def get_emailField(self, action):
        if "emailSettings" in action:
            return action.emailSettings.field

        return None


class DatasourceSerializer(DocumentSerializer):
    class Meta:
        model = Datasource
        fields = ["id", "name", "fields"]


class OrderItemSerializer(EmbeddedDocumentSerializer):
    label = serializers.SerializerMethodField()
    field_type = serializers.SerializerMethodField()

    def get_label(self, order_item):
        module = self.context["steps"][order_item.stepIndex]

        if module.type == "datasource":
            return module.datasource.labels.get(order_item.field)

        return order_item.field

    def get_field_type(self, order_item):
        module = self.context["steps"][order_item.stepIndex]

        if module.type == "datasource":
            return module.datasource.types.get(order_item.field)

        elif module.type == "form":
            form = Form.objects.get(id=module.form)
            for field in form.fields:
                if field.name == order_item.field:
                    return field.type

        elif module.type == "computed":
            for field in module.computed.fields:
                if field.name == order_item.field:
                    return field.type

    class Meta:
        model = Column
        fields = "__all__"


class OtherDatalabSerializer(DocumentSerializer):
    columns = serializers.SerializerMethodField()

    def get_columns(self, datalab):
        return [
            {"label": item.get("label"), "type": item.get("field_type")}
            for item in OrderItemSerializer(
                datalab.order, many=True, context={"steps": datalab.steps}
            ).data
        ]

    class Meta:
        model = Datalab
        fields = ["id", "name", "columns"]


class DatalabSerializer(DocumentSerializer):
    datasources = serializers.SerializerMethodField()
    dataLabs = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    columns = serializers.SerializerMethodField()
    data = serializers.ReadOnlyField()

    def get_datasources(self, datalab):
        datasources = Datasource.objects(container=datalab["container"].id)
        serializer = DatasourceSerializer(datasources, many=True)
        return serializer.data

    def get_dataLabs(self, datalab):
        datalabs = Datalab.objects(container=datalab["container"].id, id__ne=datalab.id)
        serializer = OtherDatalabSerializer(datalabs, many=True)
        return serializer.data

    def get_forms(self, datalab):
        forms = Form.objects(datalab=datalab.id)
        serializer = FormSerializer(forms, many=True)
        return serializer.data

    def get_actions(self, datalab):
        actions = Workflow.objects(datalab=datalab.id)
        serializer = ActionSerializer(actions, many=True)
        return serializer.data

    def get_columns(self, datalab):
        return OrderItemSerializer(
            datalab.order, many=True, context={"steps": datalab.steps}
        ).data

    class Meta:
        model = Datalab
        fields = "__all__"
