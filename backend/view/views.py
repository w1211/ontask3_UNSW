from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import list_route, detail_route

from collections import defaultdict
from django.http import JsonResponse
import json

from .serializers import ViewSerializer

from .models import View
# from workflow.models import Workflow
from datasource.models import DataSource


class ViewViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return View.objects.all()

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = View.objects.filter(
            name = self.request.data['name'],
            container = self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A view with this name already exists')

        data = self.combine_data(self.request.data)

        serializer.save(data=data)

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        queryset = View.objects.filter(
            name = self.request.data['name'],
            container = self.get_object()['container'],
            id__ne = self.get_object()['id'] # Check against views other than the one being updated
        )
        if queryset.count():
            raise ValidationError('A view with this name already exists')

        data = self.combine_data(self.request.data)

        serializer.save(data=data)

    def perform_destroy(self, obj):
        self.check_object_permissions(self.request, obj)

        # # Ensure that no workflow is currently using this view
        # queryset = Workflow.objects.filter(
        #     view = self.get_object()['id']
        # )
        # if queryset.count():
        #     raise ValidationError('This view is being used by a workflow')

        obj.delete()

    @detail_route(methods=['get'])
    def retrieve_view(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        serializer = ViewSerializer(instance=view)

        datasources = DataSource.objects(container=view.container.id).only('id', 'name', 'fields', 'data')
        # Return only the first row of each datasource's data
        # To be used in guessing the type of a field when trying to add a new column to the view
        for datasource in datasources:
            datasource['data'] = datasource['data'][:1]

        serializer.instance.datasources = datasources
       
        return JsonResponse(serializer.data, safe=False)

    @detail_route(methods=['put'])
    def update_discrepencies(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        view.dropDiscrepencies = request.data['dropDiscrepencies']
        print(view.dropDiscrepencies)
        data = self.combine_data(view)

        serializer = ViewSerializer(instance=view, data={
            'data': data, 
            'dropDiscrepencies': view.dropDiscrepencies
        }, partial=True)

        serializer.is_valid()
        serializer.save()

        return JsonResponse({ 'success': 'true' }, safe=False)

    @detail_route(methods=['put'])
    def update_columns(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        view.columns = request.data['columns']
        view.dropDiscrepencies = request.data['dropDiscrepencies']
        data = self.combine_data(view)

        serializer = ViewSerializer(instance=view, data={
            'data': data, 
            'columns': view.columns,
            'dropDiscrepencies': view.dropDiscrepencies
        }, partial=True)

        serializer.is_valid()
        serializer.save()

        return JsonResponse({ 'success': 'true' }, safe=False)

    @detail_route(methods=['post'])
    def delete_column(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        columnIndex = self.request.data['columnIndex']
        if columnIndex == 0:
            raise ValidationError('The primary key cannot be deleted')

        del view.columns[columnIndex]
        data = self.combine_data(view)
        serializer = ViewSerializer(instance=view, data={'data': data}, partial=True)

        serializer.is_valid()
        serializer.save()

        return JsonResponse({ 'success': 'true' }, safe=False)

    @list_route(methods=['post'])
    def preview_data(self, request):
        data = self.combine_data(self.request.data)

        # Return the first 10 records of the results
        return JsonResponse(data[:10], safe=False)

    def build_dict(self, seq, key):
        return dict((d[key], dict(d, index=index)) for (index, d) in enumerate(seq))

    def combine_data(self, view):
        steps = view['steps']

        # Initialize the dataset using the first step
        first_step = steps[0]
        if first_step['type'] == 'datasource':
            step = first_step['datasource']
            datasource = DataSource.objects.get(id=step['id'])
            data = [{step['labels'][field]: value for field, value in item.items() if field in step['fields']} for item in datasource.data]

        # For each of the remaining steps, add to the dataset
        for step in steps[1:]:
            if step['type'] == 'datasource':
                step = step['datasource']
                datasource = DataSource.objects.get(id=step['id'])
                for item in datasource.data:
                    match_index = next((index for index, d in enumerate(data) if d[step['matching']] == item[step['primary']]), None)
                    if match_index is not None:
                        data[match_index].update({step['labels'][field]: value for field, value in item.items() if field in step['fields']})
                        
        return data
