from rest_framework_mongoengine import serializers

from .models import Audit

class AuditSerializer(serializers.DocumentSerializer):

    class Meta:
        model = Audit
        fields = '__all__'