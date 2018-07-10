from collections import defaultdict

from datasource.models import Datasource


def combine_data(steps):
    # Initialize the dataset using the first module, which is always a datasource
    first_module = steps[0]['datasource']
    datasource = Datasource.objects.get(id=first_module['id'])
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
            datasource = Datasource.objects.get(id=module['id'])
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
                primary_records = {
                    item.get(module['primary']) for item in datasource.data}
                matching_records = {
                    item.get(module['matching']) for item in data}
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
