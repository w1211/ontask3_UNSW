from rest_framework import serializers
from rest_framework_mongoengine.serializers import DocumentSerializer

from .models import Form


class FormSerializer(DocumentSerializer):
    permitted_users = serializers.ReadOnlyField()
    
    class Meta:
        model = Form
        fields = "__all__"
