from rest_framework_mongoengine import serializers

from .models import View
from datasource.serializers import DataSourceSerializer

class ViewSerializer(serializers.DocumentSerializer):
    datasources = DataSourceSerializer(many=True, allow_null=True, read_only=True)

    class Meta:
        model = View
        fields = '__all__'
