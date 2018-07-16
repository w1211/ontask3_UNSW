from collections import defaultdict

from .models import Datalab
from datasource.models import Datasource
from audit.serializers import AuditSerializer


def combine_data(steps):
    # Initialize the dataset using the first module, which is always a datasource
    first_module = steps[0]["datasource"]
    datasource = Datasource.objects.get(id=first_module["id"])
    fields = first_module["fields"]
    label_map = first_module["labels"]

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

        if step["type"] == "datasource":
            module = step["datasource"]
            datasource = Datasource.objects.get(id=module["id"])
            fields = module["fields"]
            label_map = module["labels"]

            # Populate the data map before merging in this datasource module's data
            for item in data:
                # If the item has a value for this module's specified matching field
                # Note that the matching field uses labels and not the original field names
                if module["matching"] in item:
                    match_value = item[module["matching"]]
                    data_map[match_value].append(item)

            # For each record in this datasource's data, extend the matching record in the data map
            for item in datasource.data:
                match_value = item[module["primary"]]
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
                    if (
                        "discrepencies" in module
                        and "primary" in module["discrepencies"]
                        and module["discrepencies"]["primary"]
                    ):
                        new_record = {}
                        for field, value in item.items():
                            if field in fields:
                                new_record[label_map[field]] = value
                        data_map[match_value].append(new_record)

            # If the matching discrepency setting is set to True, then the user wants to keep
            # any records whose matching keys do not exist in this datasource module.
            if not (
                "discrepencies" in module
                and "matching" in module["discrepencies"]
                and module["discrepencies"]["matching"]
            ):
                primary_records = {
                    item.get(module["primary"]) for item in datasource.data
                }
                matching_records = {item.get(module["matching"]) for item in data}
                for record in matching_records - primary_records:
                    data_map.pop(record, None)

        if step["type"] == "form" and "data" in step["form"]:
            module = step["form"]

            # Populate the data map before merging in this form module's data
            for item in data:
                if module["primary"] in item:
                    match_value = item[module["primary"]]
                    data_map[match_value].append(item)

            # Update keys in the data map with this form's data
            for item in module["data"]:
                match_value = item[module["primary"]]
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


def update_form_data(
    datalab, step, field, primary, value, request_user, is_web_form=False
):
    form = datalab.steps[step].form

    datalab_data_map = {
        item[form.primary]: item for item in datalab.data if form.primary in item
    }

    # Perform permission validation manually, as opposed to using the generic
    # data lab permissions schema. This is so that we can provide access to users
    # that are not necessarily owner or have share access, but are one of the
    # permissable users on the data lab level
    is_owner = request_user == datalab.container.owner
    is_shared = request_user in datalab.container.sharing
    has_access = is_owner or is_shared

    if not has_access:
        web_form = form["webForm"]
        if is_web_form and web_form and web_form["active"]:
            permission_field = web_form["permission"]
            if web_form["showAll"]:
                permissable_users = {
                    item.get(permission_field) for item in datalab.data
                }
                has_access = request_user in permissable_users
            else:
                has_access = request_user == datalab_data_map[primary][permission_field]

    # Confirm whether the user has access after the above checks have been performed
    if not has_access:
        raise Exception("Unauthorized")

    form_data_map = {
        item[form.primary]: item for item in form.data if form.primary in item
    }

    previous_value = None
    if primary in form_data_map:
        previous_value = (
            form_data_map[primary][field] if field in form_data_map[primary] else None
        )
        form_data_map[primary].update({field: value})
    else:
        form_data_map[primary] = {form.primary: primary, field: value}

    form_data = [value for value in form_data_map.values()]

    kw = {f"set__steps__{step}__form__data": form_data}
    Datalab.objects(id=datalab.id).update(**kw)
    datalab.reload()

    data = combine_data(datalab.steps)
    Datalab.objects(id=datalab.id).update(set__data=data)
    datalab.reload()

    audit = AuditSerializer(
        data={
            "model": "datalab",
            "document": str(datalab.id),
            "action": "update_form_value",
            "user": request_user,
            "diff": {
                "form": form.name,
                "module_index": step,
                "record": primary,
                "field": field,
                "from": previous_value,
                "to": value,
            },
        }
    )
    audit.is_valid()
    audit.save()

    return datalab


def retrieve_form_data(datalab, step, request_user):
    is_owner = request_user == datalab.container.owner
    is_shared = request_user in datalab.container.sharing
    has_access = is_owner or is_shared

    # Convert the document to a format that is JSON serializable
    datalab = datalab.to_mongo()

    form = datalab["steps"][step]["form"]
    web_form = form["webForm"]

    if not web_form or not web_form["active"]:
        return {"error": "This form is currently not accessible"}

    columns = [form["primary"]] + web_form["visibleFields"]
    for field in form["fields"]:
        columns.append(field["name"])

    data = []
    permission_field = web_form["permission"]
    permissable_users = {item.get(permission_field) for item in datalab["data"]}

    for (index, item) in enumerate(datalab["data"]):
        if (
            has_access
            or web_form["showAll"]
            and request_user in permissable_users
            or item[permission_field] == request_user
        ):
            record = {field: item.get(field) for field in columns}
            data.append(record)

    if len(data) == 0:
        return {"error": "You are not authorized to access this form"}

    return {
        "name": form["name"],
        "primary_key": form["primary"],
        "columns": columns,
        "data": data,
        "editable_fields": form["fields"],
        "layout": web_form["layout"],
        "is_owner_or_shared": has_access,
    }
