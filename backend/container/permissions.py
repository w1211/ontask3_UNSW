from rest_framework import permissions

class ContainerPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        if request.method in ['PATCH', 'PUT']:
            # Only owners of the object or users given read & write access can update
            return obj.owner == request_user or request_user in obj.sharing.readWrite
        elif request.method in ['DELETE']:
            # Only owners of the object can delete
            return obj.owner == request_user
        elif request.method in ['GET']:
            # Only owners or users given read or read & write access can view the object
            return obj.owner == request_user or request_user in obj.sharing.readOnly or request_user in obj.sharing.readWrite