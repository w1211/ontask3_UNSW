from rest_framework_mongoengine import serializers

from .models import View


class ViewSerializer(serializers.DocumentSerializer):
    class Meta:
        model = View
        fields = '__all__'
