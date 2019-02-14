from rest_framework import serializers
from rest_framework_mongoengine.serializers import DocumentSerializer

from .models import Form


class FormSerializer(DocumentSerializer):
    permitted_users = serializers.ReadOnlyField()

    class Meta:
        model = Form
        fields = "__all__"


class RestrictedFormSerializer(DocumentSerializer):
    data = serializers.SerializerMethodField()
    editable_records = serializers.SerializerMethodField()

    def get_data(self, form):
        return self.context.get("data")

    def get_editable_records(self, form):
        return self.context.get("editable_records")

    class Meta:
        model = Form
        fields = [
            "id",
            "name",
            "description",
            "primary",
            "layout",
            "fields",
            "activeFrom",
            "activeTo",
            "data",
            "editable_records"
        ]
