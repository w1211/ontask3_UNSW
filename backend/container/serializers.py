from rest_framework_mongoengine import serializers

from .models import Container


class ContainerSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Container
        fields = '__all__'