from rest_framework import permissions

from container.models import Container

class WorkflowPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        if request.method in ['POST']:
            # Only owners of the workflow's parent container or users given read & write access can create a workflow in that container
            # Workflow model hasn't been saved yet, therefore the associated container does not yet refer to an actual document in the db
            # Therefore we must find the associated container with a db call first
            container = Container.objects.get(id=request.data['container'])
            return request_user == container.owner or request_user in container.sharing.readWrite
        elif request.method in ['PATCH', 'PUT']:
            # Only owners of the workflow's parent container or users given read & write access can update the workflow
            return request_user == obj.container.owner or request_user in obj.container.sharing.readWrite
        elif request.method in ['DELETE']:
            # Only owners of the workflow's parent container can delete the workflow
            return request_user == obj.container.owner
        elif request.method in ['GET']:
            # Only owners of the workflow's parent container or users given read or read & write access can view the workflow
            return request_user == obj.container.owner or request_user in obj.container.sharing.readOnly or request_user in obj.container.sharing.readWrite