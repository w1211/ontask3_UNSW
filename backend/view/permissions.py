from rest_framework import permissions


class ViewPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        request_user = request.user.id
        return True
