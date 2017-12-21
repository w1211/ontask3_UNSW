from rest_framework_mongoengine import serializers

from .models import Action


class ActionSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Action
        fields = '__all__'