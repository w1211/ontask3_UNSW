from rest_framework_mongoengine import serializers

from .models import Workflow
from datasource.serializers import DatasourceSerializer

class WorkflowSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Workflow
        fields = '__all__'

# This serializer is only used by the retrieve workflow function, 
# so that we can also show the related datasources and populate the view of the workflow
class RetrieveWorkflowSerializer(serializers.DocumentSerializer):
    datasources = DatasourceSerializer(many=True, allow_null=True, read_only=True)

    class Meta:
        model = Workflow
        fields = '__all__'
        depth = 2 # Required in order for the views and datasources references to be populated
