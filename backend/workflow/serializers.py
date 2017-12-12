from rest_framework_mongoengine import serializers

from .models import Workflow


class WorkflowSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Workflow
        fields = '__all__'