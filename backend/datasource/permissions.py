from rest_framework import permissions

class DataSourcePermissions(permissions.BasePermission):
    # Permissions for a given data source are inherited from its parent container
    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        if request.method in ['PATCH', 'PUT']:
            # Only owners of the object or users given read & write access can update
            return obj.owner == request_user or request_user in obj.container.sharing.readWrite
        elif request.method in ['DELETE']:
            # Only owners of the object can delete
            return obj.owner == request_user
        elif request.method in ['GET']:
            # Only owners or users given read or read & write access can view the object
            return obj.owner == request_user or request_user in obj.container.sharing.readOnly or request_user in obj.container.sharing.readWrite