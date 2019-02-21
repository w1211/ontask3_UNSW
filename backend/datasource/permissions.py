from rest_framework import permissions

from container.models import Container


class DatasourcePermissions(permissions.BasePermission):
    # Permissions for a given data source are inherited from its parent container
    def has_object_permission(self, request, view, obj):
        request_user = request.user.email

        # Only owners of the data sources's parent container or users given read & write access can create a data source in that container
        # Data source model hasn't been saved yet, therefore the associated container does not yet refer to an actual document in the db
        # Therefore we must find the associated container with a db call first
        if not obj:
            container = Container.objects.get(id=request.data['container'])
        else:
            container = obj.container

        is_owner = (request_user == container.owner)
        has_access = (request_user in container.sharing)

        return is_owner or has_access
