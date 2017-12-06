from rest_framework import permissions

class IsOwnerOrShared(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to perform the given function on it.
    Assumes the model instance has an `owner` attribute.
    """

    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        if request.method in ['PATCH', 'PUT', 'DELETE']:
            # Only owners of the object can update or delete 
            return obj.owner == request_user
        elif request.method in ['GET']:
            # Owners and users shared with can view the object
            return obj.owner == request_user or request_user in obj.sharedWith