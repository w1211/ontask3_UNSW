from rest_framework_mongoengine import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import detail_route

from .serializers import FormSerializer
from .permissions import FormPermissions
from .models import Form

from container.views import ContainerViewSet


class FormViewSet(viewsets.ModelViewSet):
    lookup_field = "id"
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated, FormPermissions]

    def get_queryset(self):
        # Get the containers this user owns or has access to
        containers = ContainerViewSet.get_queryset(self)

        # Retrieve only the forms that belong to these containers
        forms = Form.objects(container__in=containers)

        return forms

    def perform_create(self, serializer):
        form = serializer.save()
        form.refresh_access()

    def perform_update(self, serializer):
        form = self.get_object()

        if form.primary != self.request.data["primary"]:
            form.data = []
            form.save()
            
        form = serializer.save()
        form.refresh_access()

    def perform_destroy(self, form):
        self.check_object_permissions(self.request, form)

        # Check that no data labs are using this form

        form.delete()
