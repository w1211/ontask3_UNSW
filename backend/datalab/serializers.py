from rest_framework_mongoengine import serializers

from .models import Datalab
from datasource.serializers import DatasourceSerializer


class DatalabSerializer(serializers.DocumentSerializer):
    datasources = DatasourceSerializer(
        many=True, allow_null=True, read_only=True)

    class Meta:
        model = Datalab
        fields = '__all__'
