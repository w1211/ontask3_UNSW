from rest_framework_mongoengine import serializers

from .models import Datasource


class DatasourceSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Datasource
        fields = '__all__'
