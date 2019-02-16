from django.http import JsonResponse
from rest_framework_mongoengine import viewsets
from rest_framework_mongoengine.validators import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, list_route, detail_route
from rest_framework.response import Response
from rest_framework.status import HTTP_401_UNAUTHORIZED
from mongoengine.queryset.visitor import Q

import json

from .serializers import DatalabSerializer
from .permissions import DatalabPermissions
from .models import Datalab
from .utils import bind_column_types, set_relations

from container.models import Container
from datasource.models import Datasource
from form.models import Form


class DatalabViewSet(viewsets.ModelViewSet):
    lookup_field = "id"
    serializer_class = DatalabSerializer
    permission_classes = [IsAuthenticated, DatalabPermissions]

    def get_queryset(self):
        # Get the containers this user owns or has access to
        containers = Container.objects.filter(
            Q(owner=self.request.user.email)
            | Q(sharing__contains=self.request.user.email)
        )

        # Retrieve only the DataLabs that belong to these containers
        datalabs = Datalab.objects(container__in=containers)

        return datalabs

    def perform_create(self, serializer):
        self.check_object_permissions(self.request, None)

        steps = self.request.data["steps"]
        steps = bind_column_types(steps)

        order = []
        for (step_index, step) in enumerate(steps):
            module_type = step["type"]
            for field in step[module_type]["fields"]:
                order.append(
                    {
                        "stepIndex": step_index,
                        "field": field["name"]
                        if step["type"] in ["form", "computed"]
                        else field,
                    }
                )

        datalab = serializer.save(steps=steps, order=order)
        relations = set_relations(datalab)
        datalab.relations = relations
        datalab.save()

    def perform_update(self, serializer):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        queryset = Datalab.objects.filter(
            name=self.request.data["name"],
            container=datalab["container"],
            # Check against DataLabs other than the one being updated
            id__ne=datalab["id"],
        )
        if queryset.count():
            raise ValidationError("A DataLab with this name already exists")

        steps = self.request.data["steps"]
        steps = bind_column_types(steps)

        order = [
            {
                "stepIndex": item["stepIndex"],
                "field": item["field"],
                "visible": item["visible"],
                "pinned": item["pinned"],
            }
            for item in datalab.order
        ]

        # Check for any removed fields and remove from order list
        for item in order:
            step = steps[item["stepIndex"]] if item["stepIndex"] < len(steps) else None
            if step and step["type"] == "form":
                fields = Form.objects.get(id=step["form"]).fields
            else:
                fields = step[step["type"]]["fields"] if step else []

            if step and step["type"] == "computed":
                fields = [field["name"] for field in fields]

            if item["field"] not in fields:
                order = [
                    x
                    for x in order
                    if (x["field"] != item["field"] and x["stepIndex"] != item["field"])
                ]

        # Check for any added fields and append to end of order list
        for (step_index, step) in enumerate(steps):
            if step["type"] == "form":
                fields = Form.objects.get(id=step["form"]).fields
            else:
                fields = step[step["type"]]["fields"]

            for field in fields:
                if step["type"] in ["form", "computed"]:
                    field = field["name"]
                already_exists = next(
                    (
                        item
                        for item in order
                        if item["stepIndex"] == step_index and item["field"] == field
                    ),
                    None,
                )
                if not already_exists:
                    order.append({"stepIndex": step_index, "field": field})

        relations = set_relations(datalab)

        serializer.save(steps=steps, order=order, relations=relations)

    def perform_destroy(self, datalab):
        self.check_object_permissions(self.request, datalab)
        datalab.delete()

    @action(detail=False, methods=["post"])
    def check_discrepencies(self, request):
        check_module = request.data["partial"][-1]["datasource"]
        partial_build = request.data["partial"][:-1]

        data = []  # combine_data(partial_build)
        datasource = Datasource.objects.get(id=check_module["id"])

        primary_records = {item[check_module["primary"]] for item in datasource.data}
        matching_records = {
            item[check_module["matching"]]
            for item in data
            if check_module["matching"] in item
        }

        # Values which are in the primary datasource but not the matching
        primary_discrepencies = primary_records - matching_records
        # Values which are in the matching datasource but not the primary
        matching_discrepencies = matching_records - primary_records

        return Response(
            {
                "primary": list(primary_discrepencies)
                if len(primary_discrepencies) > 0
                else [],
                "matching": list(matching_discrepencies)
                if len(matching_discrepencies) > 0
                else [],
            }
        )

    @detail_route(methods=["patch"])
    def change_column_order(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        order = [
            {
                "stepIndex": item["stepIndex"],
                "field": item["field"],
                "visible": item["visible"],
                "pinned": item["pinned"],
            }
            for item in datalab.order
        ]
        drag_index = request.data["dragIndex"]
        hover_index = request.data["hoverIndex"]

        field = order.pop(drag_index)
        order.insert(hover_index, field)

        serializer = DatalabSerializer(
            instance=datalab, data={"order": order}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=["patch"])
    def change_column_visibility(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        column_index = request.data["columnIndex"]
        visible = request.data["visible"]

        order = [
            {
                "stepIndex": item["stepIndex"],
                "field": item["field"],
                "visible": item["visible"],
                "pinned": item["pinned"],
            }
            for item in datalab.order
        ]
        order[column_index]["visible"] = visible

        serializer = DatalabSerializer(
            instance=datalab, data={"order": order}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=["patch"])
    def change_pinned_status(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        column_index = request.data["columnIndex"]
        pinned = request.data["pinned"]

        order = [
            {
                "stepIndex": item["stepIndex"],
                "field": item["field"],
                "visible": item["visible"],
                "pinned": item["pinned"],
            }
            for item in datalab.order
        ]
        order[column_index]["pinned"] = pinned

        serializer = DatalabSerializer(
            instance=datalab, data={"order": order}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=["patch"])
    def update_field_type(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        step_index = request.data["stepIndex"]
        field_name = request.data["field"]
        field_type = request.data["type"]

        module_type = datalab.steps[step_index].type

        if module_type == "datasource":
            datalab.steps[step_index].datasource.types[field_name] = field_type

        elif module_type == "computed":
            field = next(
                (
                    field
                    for field in datalab.steps[step_index].computed.fields
                    if field.name == field_name
                ),
                None,
            )
            if field:
                field.type = field_type

        datalab.save()

        serializer = DatalabSerializer(instance=datalab)
        return JsonResponse(serializer.data)

    @detail_route(methods=["patch"])
    def update_chart(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        charts = datalab["charts"]

        for i in range(len(charts)):
            charts[i] = json.loads(charts[i].to_json())

        charts.append(request.data)

        serializer = DatalabSerializer(
            instance=datalab, data={"charts": charts}, partial=True
        )
        serializer.is_valid()
        serializer.save()

        return JsonResponse(serializer.data)

    @detail_route(methods=["post"])
    def clone_datalab(self, request, id=None):
        datalab = self.get_object()
        self.check_object_permissions(self.request, datalab)

        datalab = datalab.to_mongo()
        datalab["name"] = datalab["name"] + "_cloned"
        datalab.pop("_id")

        serializer = DatalabSerializer(data=datalab)
        serializer.is_valid()
        serializer.save()

        return JsonResponse({"success": 1})
