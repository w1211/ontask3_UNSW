from rest_framework import serializers
from rest_framework_mongoengine.serializers import DocumentSerializer

from .models import Workflow


class ActionSerializer(DocumentSerializer):
    data = serializers.ReadOnlyField()
    options = serializers.ReadOnlyField()

    class Meta:
        model = Workflow
        fields = "__all__"
