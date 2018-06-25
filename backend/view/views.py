from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import list_route, detail_route

from collections import defaultdict
from django.http import JsonResponse
import json

from .serializers import ViewSerializer
from .permissions import DataLabPermissions

from .models import View
# from workflow.models import Workflow
from datasource.models import DataSource


class ViewViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = ViewSerializer
    permission_classes = [IsAuthenticated, DataLabPermissions]

    def get_queryset(self):
        request_user = self.request.user.email
        
        pipeline = [
            {
                '$lookup': {
                    'from': 'container',
                    'localField': 'container',
                    'foreignField': '_id',
                    'as': 'container'
                }
            }, {
                '$match': {
                    '$or': [
                        {'container.owner': request_user},
                        {'container.sharing': {'$in': [request_user]}}
                    ]
                }
            }
        ]
        data_labs = list(View.objects.aggregate(*pipeline))
        return View.objects.filter(id__in = [data_lab['_id'] for data_lab in data_labs])

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = View.objects.filter(
            name = self.request.data['name'],
            container = self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A view with this name already exists')

        steps = self.request.data['steps']
        data = self.combine_data(steps)

        order = []
        for (step_index, step) in enumerate(steps):
            for field in step[step['type']]['fields']:
                order.append({ 'stepIndex': step_index, 'field': field })

        serializer.save(data=data, order=order)

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        queryset = View.objects.filter(
            name = self.request.data['name'],
            container = self.get_object()['container'],
            id__ne = self.get_object()['id'] # Check against views other than the one being updated
        )
        if queryset.count():
            raise ValidationError('A view with this name already exists')

        steps = self.request.data['steps']
        data = self.combine_data(steps)

        order = [{ 'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible'] } for item in self.get_object().order]

        # Check for any removed fields and remove from order list
        for item in order:
            step = steps[item['stepIndex']] if item['stepIndex'] in steps else None
            fields = step[step['type']]['fields'] if step else []
            if step and step['type'] == 'form':
                fields = [field['name'] for field in fields]
            if item['field'] not in fields:
                order = [x for x in order if (x['field'] != item['field'] and x['stepIndex'] != item['field'])]

        # Check for any added fields and append to end of order list
        for (step_index, step) in enumerate(steps):
            for field in step[step['type']]['fields']:
                if step['type'] == 'form':
                    field = field['name']
                already_exists = next((item for item in order if item['stepIndex'] == step_index and item['field'] == field), None)
                if not already_exists:
                    order.append({ 'stepIndex': step_index, 'field': field })
        
        serializer.save(data=data, order=order)

    def perform_destroy(self, obj):
        self.check_object_permissions(self.request, obj)

        # # Ensure that no action is currently using this data lab
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

    def combine_data(self, steps):
        # Initialize the dataset using the first step, which is always a datasource module
        datasource = DataSource.objects.get(id=steps[0]['datasource']['id'])
        data = [{steps[0]['datasource']['labels'][field]: value for field, value in item.items() if field in steps[0]['datasource']['fields']} for item in datasource.data]

        # For each of the remaining steps, add to the dataset
        data_map = { }
        for step in steps[1:]:
            if step['type'] == 'datasource':
                datasource = DataSource.objects.get(id=step['datasource']['id'])
                
                # Create a map of the data generated thus far, with the key being the matching field specified for this step
                # This allows us to efficiently lookup based on the primary key and find which record should be extended,
                # Instead of having to iterate over the list to find the matching record for every record in this datasource (n*m complexity)
                data_map = { item[step['datasource']['matching']]: item for item in data if step['datasource']['matching'] in item }

                # For each record in this datasource's data, extend the matching record in the data map
                for item in datasource.data:
                    if item[step['datasource']['primary']] in data_map:
                        data_map[item[step['datasource']['primary']]].update({step['datasource']['labels'][field]: value for field, value in item.items() if field in step['datasource']['fields']})
                    else:
                        if 'discrepencies' in step and 'primary' in step['discrepencies'] and not step['discrepencies']['primary']:
                            data_map[item[step['datasource']['primary']]] = {step['datasource']['labels'][field]: value for field, value in item.items() if field in step['datasource']['fields']}

                if 'discrepencies' in step and step['discrepencies'] is not None and 'matching' in step['discrepencies'] and step['discrepencies']['matching']:
                    primary_records = { item[step['datasource']['primary']] for item in datasource.data }
                    matching_records = { item[step['datasource']['matching']] for item in data if step['datasource']['matching'] in item }
                    matching_discrepencies = matching_records - primary_records
                    for record in matching_discrepencies:
                        data_map.pop(record, None)

            if step['type'] == 'form' and 'data' in step['form']:
                primary = step['form']['primary']
                form_data = step['form']['data']

                # Initialise the data map based on the values bound thus far
                data_map = { item[primary]: item for item in data if primary in item }

                # Update keys in the data map with this form's data
                for item in form_data:
                    if primary in item and item[primary] in data_map:
                        data_map[item[primary]].update(item)

            # Create the data (list of dicts, with each dict representing a record) based on the updated data map 
            data = [value for value in data_map.values()] if len(data_map) else data

        return data

    @list_route(methods=['post'])
    def check_discrepencies(self, request):
        build = self.request.data['build']
        check_step = self.request.data['checkStep']
        is_edit = self.request.data['isEdit']

        data = self.combine_data(build)
        datasource = DataSource.objects.get(id=check_step['datasource']['id'])

        primary_records = { item[check_step['datasource']['primary']] for item in datasource.data }
        matching_records = { item[check_step['datasource']['matching']] for item in data if check_step['datasource']['matching'] in item }

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

    @detail_route(methods=['patch'])
    def update_form_values(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        step = request.data['stepIndex']
        field = request.data['field']
        values = request.data['values'] if 'values' in request.data else None
        
        form = view.steps[step].form

        form_data_map = { item[form.primary]: item for item in form.data if form.primary in item }

        if values:
            for primary_key, value in values.items():
                if primary_key in form_data_map:
                    form_data_map[primary_key].update({ field: value })
                else:
                    form_data_map[primary_key] = { form.primary: primary_key, field: value }

        form_data = [value for value in form_data_map.values()]

        kw = { f'set__steps__{step}__form__data': form_data }
        View.objects(id=id).update(**kw)
        
        view.reload()
        data = self.combine_data(view.steps)
        View.objects(id=id).update(set__data = data)

        return JsonResponse({ 'data': data })

    @detail_route(methods=['patch'])
    def change_column_order(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        order = [{ 'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible'] } for item in view.order]
        drag_index = request.data['dragIndex']
        hover_index = request.data['hoverIndex']

        field = order.pop(drag_index)
        order.insert(hover_index, field)

        serializer = ViewSerializer(instance=view, data={'order': order}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=['patch'])
    def change_column_visibility(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        column_index = request.data['columnIndex']
        visible = request.data['visible']

        order = [{ 'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible'] } for item in view.order]
        order[column_index]['visible'] = visible

        serializer = ViewSerializer(instance=view, data={'order': order}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)


    @detail_route(methods=['patch'])
    def update_field_type(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        step_index = request.data['stepIndex']
        field = request.data['field']
        field_type = request.data['type']

        view.steps[step_index].datasource.types[field] = field_type
        view.save()

        serializer = ViewSerializer(instance=view)
        return JsonResponse(serializer.data)
