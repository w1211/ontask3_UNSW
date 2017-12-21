from rest_framework import permissions

from container.models import Container

class ActionPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        if request.method in ['POST']:
            # Actions belong to a workflow, and workflows in turn belong to a container
            # Only owners of the parent container or users given read & write access can create an action associated with that container
            # Action model hasn't been saved yet, therefore the associated workflow/container does not yet refer to an actual document in the db
            # Therefore we must find the associated workflow/container with a db call first
            workflow = Container.objects.get(id=request.data['workflow'])
            return request_user == workflow.container.owner or request_user in workflow.container.sharing.readWrite
        elif request.method in ['PATCH', 'PUT']:
            # Only owners of the associated workflow's parent container or users given read & write access can update the workflow
            return request_user == obj.workflow.container.owner or request_user in obj.workflow.container.sharing.readWrite
        elif request.method in ['DELETE']:
            # Only owners of the associated workflow's parent container can delete the workflow
            return request_user == obj.workflow.container.owner
        elif request.method in ['GET']:
            # Only owners of the associated workflow's parent container or users given read or read & write access can view the workflow
            return request_user == obj.workflow.container.owner or request_user in obj.workflow.container.sharing.readOnly or request_user in obj.workflow.container.sharing.readWrite