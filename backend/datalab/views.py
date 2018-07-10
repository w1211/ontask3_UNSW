from django.http import JsonResponse
from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import list_route, detail_route

import json

from .serializers import DatalabSerializer
from .permissions import DatalabPermissions
from .models import Datalab
from .utils import combine_data

from container.views import ContainerViewSet
from datasource.models import Datasource
from workflow.models import Workflow
from audit.serializers import AuditSerializer


class DatalabViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    serializer_class = DatalabSerializer
    permission_classes = [IsAuthenticated, DatalabPermissions]

    def get_queryset(self):
        # Get the containers this user owns or has access to
        containers = ContainerViewSet.get_queryset(self)

        # Retrieve only the DataLabs that belong to these containers
        datalabs = Datalab.objects(container__in=containers)

        return datalabs

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        queryset = Datalab.objects.filter(
            name=self.request.data['name'],
            container=self.request.data['container']
        )
        if queryset.count():
            raise ValidationError('A DataLab with this name already exists')

        steps = self.request.data['steps']
        data = combine_data(steps)

        order = []
        for (step_index, step) in enumerate(steps):
            module_type = step['type']
            for field in step[module_type]['fields']:
                order.append({'stepIndex': step_index, 'field': field})

        datalab = serializer.save(data=data, order=order)

        audit = AuditSerializer(data={
            'model': 'datalab',
            'document': str(datalab.id),
            'action': 'create',
            'user': self.request.user.email
        })
        audit.is_valid()
        audit.save()

    def perform_update(self, serializer):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        queryset = Datalab.objects.filter(
            name=self.request.data['name'],
            container=datalab['container'],
            # Check against DataLabs other than the one being updated
            id__ne=datalab['id']
        )
        if queryset.count():
            raise ValidationError('A DataLab with this name already exists')

        steps = self.request.data['steps']
        data = combine_data(steps)

        order = [{'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible']}
                 for item in datalab.order]

        # Check for any removed fields and remove from order list
        for item in order:
            step = steps[item['stepIndex']
                         ] if item['stepIndex'] < len(steps) else None
            fields = step[step['type']]['fields'] if step else []
            if step and step['type'] == 'form':
                fields = [field['name'] for field in fields]
            if item['field'] not in fields:
                order = [x for x in order if (
                    x['field'] != item['field'] and x['stepIndex'] != item['field'])]

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

        # Identify the changes made to the datasource
        diff = {'steps': []}
        updated_datalab = serializer.instance
        removed_module = None

        if datalab['name'] != updated_datalab['name']:
            diff['name'] = {'from': datalab['name'], 'to': updated_datalab['name']}

        for step_index, step in enumerate(datalab['steps']):
            is_outside_bound = step_index >= len(updated_datalab['steps'])
            does_not_match = is_outside_bound or datalab['steps'][step_index][
                'type'] != updated_datalab['steps'][step_index]['type']

            # If the type of module at a given index has changed, then the user must have
            # deleted all modules from that index onwards. This is because the module type
            # can only be changed by placing a module of different type in its place, and
            # only the righter-most module can be deleted at any given time.
            if does_not_match:
                removed_module = step_index
                # Mark all modules from this point onwards as having been deleted
                for step in datalab['steps'][step_index:]:
                    diff['steps'].append({'remove': step.to_mongo()})
                # Break out of the initial enumerate loop, NOT the second loop
                # since we don't need to check any modules after this index, because
                # we already know they must have been deleted (following the logic above)
                break

            # Otherwise, if its the same module, check for any changes to the module parameters
            else:
                module = datalab['steps'][step_index].to_mongo()
                updated_module = updated_datalab['steps'][step_index].to_mongo()
                module_changes = {'type': module['type'], module['type']: {}}

                # If the module is a form, and its form data has gone from having values to 
                # not having any, then the form module must have been removed (with another 
                # form added in its place). The type difference check (does_not_match) performed 
                # above would not have detected this, since both modules are of the same type. 
                # This is only relevant for forms, since we want to emphasise the fact that a form 
                # module was REMOVED in case we want to trace data loss
                if module['type'] == 'form' and (len(module['form']['data']) and not len(updated_module['form']['data'])):
                    removed_module = step_index
                    diff['steps'].append({'remove': step.to_mongo()})
                    # Break out of the enumerate loop, since all modules after this one must 
                    # have been newly added
                    break

                for field in module[module['type']]:
                    old_value = module[module['type']][field]
                    new_value = updated_module[updated_module['type']][field]

                    if old_value != new_value:
                        module_changes[module['type']][field] = {
                            'from': old_value, 'to': new_value}

                if len(module_changes[module['type']].keys()):
                    diff['steps'].append({'update': module_changes})

        # If a module was removed, then we know that any module from this index onwards
        # in the updated datalab must have been newly added
        if removed_module:
            for step in updated_datalab['steps'][removed_module:]:
                diff['steps'].append({'add': step.to_mongo()})
        # Otherwise if no module was removed, but the number of modules in the updated
        # datalab is more than the original, then those modules must have been newly added
        elif len(updated_datalab['steps']) > len(datalab['steps']):
            for step in updated_datalab['steps'][len(datalab['steps']):]:
                diff['steps'].append({'add': step.to_mongo()})

        if not len(diff['steps']):
            del diff['steps']

        # If changes were detected, add a record to the audit collection
        if len(diff.keys()):
            audit = AuditSerializer(data={
                'model': 'datalab',
                'document': str(datalab.id),
                'action': 'edit',
                'user': self.request.user.email,
                'diff': diff
            })
            audit.is_valid()
            audit.save()

    def perform_destroy(self, datalab):
        self.check_object_permissions(self.request, datalab)
        datalab.delete()

        audit = AuditSerializer(data={
            'model': 'datalab',
            'document': str(datalab.id),
            'action': 'delete',
            'user': self.request.user.email
        })
        audit.is_valid()
        audit.save()

    @detail_route(methods=['get'])
    def retrieve_datalab(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        serializer = DatalabSerializer(instance=datalab)

        datasources = Datasource.objects(container=datalab.container.id).only(
            'id', 'name', 'fields')

        serializer.instance.datasources = datasources

        return JsonResponse({'dataLab': serializer.data})

    @list_route(methods=['post'])
    def check_discrepencies(self, request):
        partial_build = self.request.data['partialBuild']
        check_module = self.request.data['checkModule']['datasource']

        data = combine_data(partial_build)
        datasource = Datasource.objects.get(id=check_module['id'])

        primary_records = {item[check_module['primary']]
                           for item in datasource.data}
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

        data = combine_data(partial_build)

        all_records = [item[primary_key]
                       for item in data if primary_key in item]
        unique_records = set(all_records)

        return JsonResponse({'isUnique': len(all_records) == len(unique_records)})

    @detail_route(methods=['patch'])
    def update_form_values(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        step = request.data['stepIndex']
        field = request.data['field']
        values = request.data['values'] if 'values' in request.data else None

        form = datalab.steps[step].form

        form_data_map = {
            item[form.primary]: item for item in form.data if form.primary in item}

        if values:
            for primary_key, value in values.items():
                if primary_key in form_data_map:
                    form_data_map[primary_key].update({field: value})
                else:
                    form_data_map[primary_key] = {
                        form.primary: primary_key, field: value}

        form_data = [value for value in form_data_map.values()]

        kw = {f'set__steps__{step}__form__data': form_data}
        Datalab.objects(id=id).update(**kw)
        datalab.reload()

        data = combine_data(datalab.steps)
        Datalab.objects(id=id).update(set__data=data)
        datalab.reload()

        serializer = DatalabSerializer(instance=datalab)

        return JsonResponse(serializer.data)

    @detail_route(methods=['patch'])
    def change_column_order(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        order = [{'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible']}
                 for item in datalab.order]
        drag_index = request.data['dragIndex']
        hover_index = request.data['hoverIndex']

        field = order.pop(drag_index)
        order.insert(hover_index, field)

        serializer = DatalabSerializer(
            instance=datalab, data={'order': order}, partial=True)
        serializer.is_valid()
        serializer.save()

        audit = AuditSerializer(data={
            'model': 'datalab',
            'document': str(datalab.id),
            'action': 'change_column_order',
            'user': self.request.user.email,
            'diff': {
                'field': field['field'],
                'from': drag_index,
                'to': hover_index
            }
        })
        audit.is_valid()
        audit.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=['patch'])
    def change_column_visibility(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        column_index = request.data['columnIndex']
        visible = request.data['visible']

        order = [{'stepIndex': item['stepIndex'], 'field': item['field'], 'visible': item['visible']}
                 for item in datalab.order]
        order[column_index]['visible'] = visible

        serializer = DatalabSerializer(
            instance=datalab, data={'order': order}, partial=True)
        serializer.is_valid()
        serializer.save()

        audit = AuditSerializer(data={
            'model': 'datalab',
            'document': str(datalab.id),
            'action': 'change_column_visibility',
            'user': self.request.user.email,
            'diff': {
                'field': order[column_index]['field'],
                'from': not visible,
                'to': visible
            }
        })
        audit.is_valid()
        audit.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=['patch'])
    def update_field_type(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        step_index = request.data['stepIndex']
        field = request.data['field']
        field_type = request.data['type']

        datalab.steps[step_index].datasource.types[field] = field_type
        datalab.save()

        serializer = DatalabSerializer(instance=datalab)
        return JsonResponse(serializer.data)

    @detail_route(methods=['patch'])
    def update_chart(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        charts = datalab['charts']

        for i in range(len(charts)):
            charts[i] = json.loads(charts[i].to_json())

        charts.append(request.data)

        serializer = DatalabSerializer(
            instance=datalab, data={'charts': charts}, partial=True)
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=['post'])
    def retrieve_form(self, request, id=None):
        datalab = self.get_object()

        request_user = request.user.email
        has_access = datalab.container.owner == request_user or request_user in datalab.container.sharing

        module_index = int(request.data['moduleIndex'])
        form_module = datalab.steps[module_index]['form']
        web_form = form_module['webForm']

        if not web_form['active']:
            return JsonResponse({'error': 'This form is currently not accessible'})

        columns = [form_module['primary']] + web_form['visibleFields']
        for field in form_module['fields']:
            columns.append(field['name'])

        data = []
        permission_field = web_form['permission']
        permissable_users = {item.get(permission_field)
                             for item in datalab.data}

        for (index, item) in enumerate(datalab.data):
            if (web_form['showAll'] and request_user in permissable_users) or ('permission_field' in web_form and web_form['permission_field'] == request_user) or has_access:
                record = {field: item.get(field) for field in columns}
                data.append(record)

        if len(data) == 0:
            return JsonResponse({'error': 'You are not authorized to access this form'})

        serializer = DatalabSerializer(instance=datalab)
        editable_fields = serializer.data['steps'][module_index]['form']['fields']

        response = {
            'name': form_module.name,
            'primary_key': form_module['primary'],
            'columns': columns,
            'data': data,
            'editable_fields': editable_fields,
            'layout': web_form['layout']
        }

        return JsonResponse(response)

    @detail_route(methods=['patch'])
    def update_table_form(self, request, id=None):
        datalab = self.get_object()

        request_user = request.user.email
        has_access = datalab.container.owner == request_user or request_user in datalab.container.sharing

        module_index = int(request.data['moduleIndex'])
        values = request.data['data'] if 'data' in request.data else []

        form = datalab.steps[module_index].form
        form_data_map = {
            item[form.primary]: item for item in form.data if form.primary in item}
        web_form = form['webForm']

        datalab_data_map = {
            item[form.primary]: item for item in datalab.data if form.primary in item}

        permission_field = web_form['permission']
        permissable_users = {item.get(permission_field)
                             for item in datalab.data}

        for item in values:
            if has_access or form.primary in item and ((web_form['showAll'] and request_user in permissable_users) or datalab_data_map[item[form.primary]][permission_field] == request_user):
                primary_value = item[form.primary]
                for field in form.fields:
                    field = field.name
                    if primary_value in form_data_map:
                        form_data_map[primary_value].update(
                            {field: item[field]})
                    else:
                        form_data_map[primary_value] = {
                            form.primary: primary_value, field: item[field]}

        form_data = [value for value in form_data_map.values()]

        kw = {f'set__steps__{module_index}__form__data': form_data}
        Datalab.objects(id=id).update(**kw)

        datalab.reload()
        data = combine_data(datalab.steps)
        Datalab.objects(id=id).update(set__data=data)

        return self.retrieve_form(request, id)
