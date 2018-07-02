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
        return View.objects.filter(id__in=[data_lab['_id'] for data_lab in data_labs])

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = View.objects.filter(
            name=self.request.data['name'],
            container=self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A DataLab with this name already exists')

        steps = self.request.data['steps']
        data = self.combine_data(steps)

        order = []
        for (step_index, step) in enumerate(steps):
            for field in step[step['type']]['fields']:
                order.append({'stepIndex': step_index, 'field': field})

        serializer.save(data=data, order=order)

    def perform_update(self, serializer):
        self.check_object_permissions(self.request, self.get_object())

        queryset = View.objects.filter(
            name=self.request.data['name'],
            container=self.get_object()['container'],
            id__ne=self.get_object()['id']  # Check against data labs other than the one being updated
        )
        if queryset.count():
            raise ValidationError('A DataLab with this name already exists')

        steps = self.request.data['steps']
        data = self.combine_data(steps)

        order = [{'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible']}
                 for item in self.get_object().order]

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
                already_exists = next(
                    (item for item in order if item['stepIndex'] == step_index and item['field'] == field), None)
                if not already_exists:
                    order.append({'stepIndex': step_index, 'field': field})

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
        # Initialize the dataset using the first module, which is always a datasource
        first_module = steps[0]['datasource']
        datasource = DataSource.objects.get(id=first_module['id'])
        fields = first_module['fields']
        label_map = first_module['labels']

        data = []
        for item in datasource.data:
            record = {}
            for field, value in item.items():
                if field in fields:
                    # Add the field to the record object using the field's label
                    record[label_map[field]] = value
            data.append(record)

        # For each of the remaining modules, incrementally add to the dataset
        for step in steps[1:]:
            # Instantiate an object that will be a map of the data generated thus far,
            # with the key being the matching field specified for this step. This allows
            #  us to efficiently lookup based on the primary key and find which record
            # should be extended, instead of having to iterate over the list to find the
            # matching record for every record in this datasource
            data_map = defaultdict(list)

            if step['type'] == 'datasource':
                module = step['datasource']
                datasource = DataSource.objects.get(id=module['id'])
                fields = module['fields']
                label_map = module['labels']

                # Populate the data map before merging in this datasource module's data
                for item in data:
                    # If the item has a value for this module's specified matching field
                    # Note that the matching field uses labels and not the original field names
                    if module['matching'] in item:
                        match_value = item[module['matching']]
                        data_map[match_value].append(item)

                # For each record in this datasource's data, extend the matching record in the data map
                for item in datasource.data:
                    match_value = item[module['primary']]
                    # If the match value for this record is in the data map, then extend
                    # each of the matched records with the chosen fields from this datasource module
                    if match_value in data_map:
                        for matched_record in data_map[match_value]:
                            for field, value in item.items():
                                if field in fields:
                                    matched_record[label_map[field]] = value

                    # If the match value is not in the data map, then there is a discrepency.
                    # The user would have been prompted on how to deal with discrepencies after they
                    # chose the matching field for this module in the model interface of the DataLab
                    else:
                        # If the primary discrepency setting is set to True, then the user wants to keep
                        # the record even with values missing for the previous modules
                        if 'discrepencies' in module and 'primary' in module['discrepencies'] and module['discrepencies']['primary']:
                            new_record = {}
                            for field, value in item.items():
                                if field in fields:
                                    new_record[label_map[field]] = value
                            data_map[match_value].append(new_record)

                # If the matching discrepency setting is set to True, then the user wants to keep
                # any records whose matching keys do not exist in this datasource module.
                if not ('discrepencies' in module and 'matching' in module['discrepencies'] and module['discrepencies']['matching']):
                    primary_records = {item.get(module['primary']) for item in datasource.data}
                    matching_records = {item.get(module['matching']) for item in data}
                    for record in matching_records - primary_records:
                        data_map.pop(record, None)

            if step['type'] == 'form' and 'data' in step['form']:
                module = step['form']

                # Populate the data map before merging in this form module's data
                for item in data:
                    if module['primary'] in item:
                        match_value = item[module['primary']]
                        data_map[match_value].append(item)

                # Update keys in the data map with this form's data
                for item in module['data']:
                    match_value = item[module['primary']]
                    if match_value in data_map:
                        for matched_record in data_map[match_value]:
                            matched_record.update(item)

            # Create the data (list of dicts, with each dict representing a record) based on the updated data map
            if len(data_map):
                data = []
                for match in data_map.values():
                    for item in match:
                        data.append(item)

        return data

    @list_route(methods=['post'])
    def check_discrepencies(self, request):
        partial_build = self.request.data['partialBuild']
        check_module = self.request.data['checkModule']['datasource']

        data = self.combine_data(partial_build)
        datasource = DataSource.objects.get(id=check_module['id'])

        primary_records = {item[check_module['primary']] for item in datasource.data}
        matching_records = {item[check_module['matching']]
                            for item in data if check_module['matching'] in item}

        response = {}

        # If there are already values, then add them to the response
        if 'discrepencies' in check_module:
            response['values'] = {}
            if 'primary' in check_module['discrepencies']:
                response['values']['primary'] = check_module['discrepencies']['primary']
            if 'matching' in check_module['discrepencies']:
                response['values']['matching'] = check_module['discrepencies']['matching']

        # Values which are in the primary datasource but not the matching
        primary_discrepencies = primary_records - matching_records
        if len(primary_discrepencies) > 0:
            response['primary'] = list(primary_discrepencies)

        # Values which are in the matching datasource but not the primary
        matching_discrepencies = matching_records - primary_records
        if len(matching_discrepencies) > 0:
            response['matching'] = list(matching_discrepencies)

        return JsonResponse(response)

    @list_route(methods=['post'])
    def check_uniqueness(self, request):
        partial_build = self.request.data['partialBuild']
        primary_key = self.request.data['primaryKey']

        data = self.combine_data(partial_build)

        all_records = [item[primary_key] for item in data]
        unique_records = set(all_records)

        return JsonResponse({'isUnique': len(all_records) == len(unique_records)})

    @detail_route(methods=['patch'])
    def update_form_values(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        step = request.data['stepIndex']
        field = request.data['field']
        values = request.data['values'] if 'values' in request.data else None

        form = view.steps[step].form

        form_data_map = {item[form.primary]: item for item in form.data if form.primary in item}

        if values:
            for primary_key, value in values.items():
                if primary_key in form_data_map:
                    form_data_map[primary_key].update({field: value})
                else:
                    form_data_map[primary_key] = {form.primary: primary_key, field: value}

        form_data = [value for value in form_data_map.values()]

        kw = {f'set__steps__{step}__form__data': form_data}
        View.objects(id=id).update(**kw)

        view.reload()
        data = self.combine_data(view.steps)
        View.objects(id=id).update(set__data=data)

        return JsonResponse({'data': data})

    @detail_route(methods=['patch'])
    def change_column_order(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        order = [{'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible']}
                 for item in view.order]
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

        order = [{'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible']}
                 for item in view.order]
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

    @detail_route(methods=['post'])
    def retrieve_form(self, request, id=None):
        data_lab = View.objects.get(id=id)
        self.check_object_permissions(self.request, data_lab)

        request_user = request.user.email

        module_index = int(request.data['moduleIndex'])
        form_module = data_lab.steps[module_index]['form']
        web_form = form_module['webForm']

        if not web_form['active']:
            return JsonResponse({'error': 'This form is currently not accessible'})

        columns = [form_module['primary']] + web_form['visibleFields'] + [field['name']
                                                                          for field in form_module['fields']]

        data = []
        permission_field = web_form['permission']
        editable_records = []
        for (index, item) in enumerate(data_lab.data):
            record = {field: item.get(field) for field in columns}
            record['key'] = index
            data.append(record)
            if item.get(permission_field) == request_user:
                editable_records.append(item[form_module['primary']])

        if len(editable_records) == 0:
            return JsonResponse({'error': 'You are not authorized to access this form'})

        if not web_form['showAll']:
            filtered_data = []
            for (index, item) in enumerate(data):
                if data_lab.data[index].get(permission_field) == request_user:
                    filtered_data.append(item)
            data = filtered_data

        serializer = ViewSerializer(instance=data_lab)
        editable_fields = serializer.data['steps'][module_index]['form']['fields']

        response = {
            'name': form_module.name,
            'primary_key': form_module['primary'],
            'editable_records': editable_records,
            'columns': columns,
            'data': data,
            'editable_fields': editable_fields,
            'layout': web_form['layout']
        }

        return JsonResponse(response)

    @detail_route(methods=['patch'])
    def update_table_form(self, request, id=None):
        view = View.objects.get(id=id)
        self.check_object_permissions(self.request, view)

        request_user = request.user.email

        module_index = int(request.data['moduleIndex'])
        values = request.data['data'] if 'data' in request.data else []

        form = view.steps[module_index].form
        form_data_map = {item[form.primary]: item for item in form.data if form.primary in item}
        web_form = form['webForm']

        datalab_data_map = {item[form.primary]: item for item in view.data if form.primary in item}

        permission_field = web_form['permission']
        for item in values:
            if form.primary in item and datalab_data_map[item[form.primary]][permission_field] == request_user:
                primary_value = item[form.primary]
                for field in form.fields:
                    field = field.name
                    if primary_value in form_data_map:
                        form_data_map[primary_value].update({field: item[field]})
                    else:
                        form_data_map[primary_value] = {form.primary: primary_value, field: item[field]}

        form_data = [value for value in form_data_map.values()]

        kw = {f'set__steps__{module_index}__form__data': form_data}
        View.objects(id=id).update(**kw)

        view.reload()
        data = self.combine_data(view.steps)
        View.objects(id=id).update(set__data=data)

        return self.retrieve_form(request, id)
