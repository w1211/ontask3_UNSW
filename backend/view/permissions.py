from rest_framework import permissions


class ViewPermissions(permissions.BasePermission):
    # Permissions for a given view are inherited from its parent container
    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        if request.method in ['POST']:
            # Only owners of the view's parent container or users given read & write access can create a view in that container
            # View model hasn't been saved yet, therefore the associated container does not yet refer to an actual document in the db
            # Therefore we must find the associated container with a db call first
            container = Container.objects.get(id=request.data['container'])
            return request_user == container.owner or request_user in container.sharing.readWrite
        if request.method in ['PATCH', 'PUT']:
            # Only owners of the object or users given read & write access can update
            return obj.container.owner == request_user or request_user in obj.container.sharing.readWrite
        elif request.method in ['DELETE']:
            # Only owners of the object can delete
            return obj.container.owner == request_user
        elif request.method in ['GET']:
            # Only owners or users given read or read & write access can view the object
            return obj.container.owner == request_user or request_user in obj.container.sharing.readOnly or request_user in obj.container.sharing.readWrite
