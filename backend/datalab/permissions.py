from rest_framework import permissions

from container.models import Container


class DatalabPermissions(permissions.BasePermission):
    # Permissions for a given data lab are inherited from its parent container
    def has_object_permission(self, request, view, obj):
        request_user = request.user.email

        if not obj:
            container = Container.objects.get(id=request.data['container'])
        else:
            container = obj.container

        is_owner = (request_user == container.owner)
        has_access = (request_user in container.sharing)

        return is_owner or has_access
