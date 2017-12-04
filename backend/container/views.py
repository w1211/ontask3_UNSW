from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError

from .serializers import ContainerSerializer
from .models import Container


class ContainerViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ContainerSerializer

    def get_queryset(self):
        return Container.objects.all()

    def perform_create(self, serializer):
        # We are manually checking that the combination of (owner, code) is unique
        # We cannot take advantage of MongoEngine's inbuilt "unique_with" attribute in the Container model
        # Because we are not sending the owner attribute in the request body (rather, it is provided by the request.user)
        queryset = Container.objects.filter(
            owner = self.request.user.id,
            code = self.request.data['code']
        )
        if queryset.count():
            raise ValidationError('A container with this code already exists')
        serializer.save(owner=self.request.user.id)

    def perform_update(self, serializer):
        queryset = Container.objects.filter(
            # We only want to check against the documents that are not the document being updated
            # I.e. only include objects in the filter that do not have the same id as the current object
            # id != self.kwargs.get(self.lookup_field) is syntactically incorrect
            # So instead we are making use of a query operator [field]__ne (i.e. field not equal to)
            # Refer to http://docs.mongoengine.org/guide/querying.html#query-operators for more information
            id__ne = self.kwargs.get(self.lookup_field), # Get the id of the object from the url route as defined by the lookup_field
            owner = self.request.user.id,
            code = self.request.data['code']
        )
        if queryset.count():
            raise ValidationError('A container with this code already exists')
        serializer.save()

    # TO DO: Delete function should be cascading
    # I.e. delete all associated Data Sources, Matrices, etc