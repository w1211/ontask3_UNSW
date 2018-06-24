from rest_framework import permissions


class ContainerPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        is_owner = (request.user.email == obj.owner)
        has_access = (request.user.email in obj.sharing)

        if request.method in ['PATCH', 'PUT']:
            # Only owners of the object or users given read & write access can update
            return is_owner or has_access
        elif request.method in ['DELETE']:
            # Only owners of the object can delete
            return is_owner
        elif request.method in ['GET']:
            # Only owners or users given read or read & write access can view the object
            return is_owner or has_access
