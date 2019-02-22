from rest_framework.permissions import BasePermission


class CanCreateObjects(BasePermission):
    """
    Only allow admins or instructors to create containers, datasources, etc.
    """

    def has_permission(self, request, view):
        permissable_groups = ["admin", "instructor"]
        return any(
            [group.name in permissable_groups for group in request.user.groups.all()]
        )
