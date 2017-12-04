from rest_framework_mongoengine import serializers

from .models import Matrix


class MatrixSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Matrix
        fields = '__all__'