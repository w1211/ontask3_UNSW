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

        data = self.combine_data(self.request.data['steps'])

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

        data = self.combine_data(self.request.data['steps'])

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

    def combine_data(self, steps):
        # Initialize the dataset using the first step
        first_step = steps[0]
        if first_step['type'] == 'datasource':
            step = first_step['datasource']
            datasource = DataSource.objects.get(id=step['id'])
            data = [{step['labels'][field]: value for field, value in item.items() if field in step['fields']} for item in datasource.data]

        # For each of the remaining steps, add to the dataset
        for step in steps[1:]:
            if step['type'] == 'datasource':
                datasource = DataSource.objects.get(id=step['datasource']['id'])
                # Create a map of the data generated thus far, with the key being the matching field specified for this step
                # This allows us to efficiently lookup based on the primary key and find which record should be extended,
                # Instead of having to iterate over the list to find the matching record for every record in this datasource (n*m complexity)
                data_map = { item[step['datasource']['matching']]: item for item in data }
                # For each record in this datasource's data, extend the matching record in the data map
                for item in datasource.data:
                    if item[step['datasource']['primary']] in data_map:
                        data_map[item[step['datasource']['primary']]].update({step['datasource']['labels'][field]: value for field, value in item.items() if field in step['datasource']['fields']})
                    else:
                        if 'discrepencies' in step and not step['discrepencies']['primary']:
                            data_map[item[step['datasource']['primary']]] = {step['datasource']['labels'][field]: value for field, value in item.items() if field in step['datasource']['fields']}

                if 'discrepencies' in step and step['discrepencies']['matching']:
                    primary_records = { item[step['datasource']['primary']] for item in datasource.data }
                    matching_records = { item[step['datasource']['matching']] for item in data }
                    matching_discrepencies = matching_records - primary_records
                    for record in matching_discrepencies:
                        data_map.pop(record, None)

                # Create the data (list of dicts, with each dict representing a record) based on the updated data map 
                data = [value for value in data_map.values()]
                
        return data

    @list_route(methods=['post'])
    def check_discrepencies(self, request):
        build = self.request.data['build']
        check_step = self.request.data['checkStep']
        is_edit = self.request.data['isEdit']

        data = self.combine_data(build)
        datasource = DataSource.objects.get(id=check_step['datasource']['id'])

        primary_records = { item[check_step['datasource']['primary']] for item in datasource.data }
        matching_records = { item[check_step['datasource']['matching']] for item in data }

        response = { 'step': len(build), 'datasource': datasource.name, 'isEdit': is_edit }

        # If there are already values, then add them to the response
        if 'discrepencies' in check_step:
            response['values'] = {}
            if 'primary' in check_step['discrepencies']:
                response['values']['primary'] = check_step['discrepencies']['primary']
            if 'matching' in check_step['discrepencies']:
                response['values']['matching'] = check_step['discrepencies']['matching']

        # Values which are in the primary datasource but not the matching
        primary_discrepencies = primary_records - matching_records
        if len(primary_discrepencies) > 0:
            response['primary'] = [value for value in primary_discrepencies]

        # Values which are in the matching datasource but not the primary
        matching_discrepencies = matching_records - primary_records
        if len(matching_discrepencies) > 0:
            response['matching'] = [value for value in matching_discrepencies]

        return JsonResponse(response)
