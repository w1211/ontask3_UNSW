import re
from dateutil import parser
import time


def transform(value, param_type):
    try:
        if param_type == "number":
            value = float(value)

        elif param_type == "date":
            value = parser.parse(value)
            value = int(time.mktime(value.timetuple()))

        return value

    except:
        return None


def did_pass_test(test, value, param_type):
    value = transform(value, param_type)
    if "comparator" in test:
        comparator = transform(test["comparator"], param_type)
    else:
        test["rangeFrom"] = transform(test["rangeFrom"], param_type)
        test["rangeTo"] = transform(test["rangeTo"], param_type)

    operator = test["operator"]

    try:
        if operator == "==":
            return value == comparator
        elif operator == "!=":
            return value != comparator
        elif operator == "IS_NULL":
            return value == "" or value is None
        elif operator == "IS_NOT_NULL":
            return value != "" and value is not None
        elif operator == "IS_TRUE" or operator == "IS_FALSE":
            return bool(value)
        elif operator == "<":
            return value < comparator
        elif operator == "<=":
            return value <= comparator
        elif operator == ">":
            return value > comparator
        elif operator == ">=":
            return value >= comparator
        elif operator == "between":
            return value >= test["rangeFrom"] and value <= test["rangeTo"]
        elif operator == "contains":
            return comparator.lower() in (item.lower() for item in value)
        else:
            return False
    except:
        return False


def populate_field(match, item, order):
    field = match.group(1)
    value = item.get(field)

    for item in order:
        if item["details"]["label"] == field:
            if item["details"]["field_type"] == "checkbox":
                value = value if value else "False"

            elif item["details"]["field_type"] == "list":
                if not isinstance(value, list):
                    value = [value]

                mapping = {
                    option["value"]: option["label"]
                    for option in item["details"]["options"]
                }
                value = [mapping.get(value, "") for value in value]

        elif field in item["details"].get("fields", []):
            value = "False" if not value else value

    if isinstance(value, list):
        value = ", ".join(value if value else "")
    elif not isinstance(value, str):
        value = str(value)

    return value


def parse_content_line(line, item, order):
    return re.sub(
        r"<attribute>(.*?)</attribute>",
        lambda match: populate_field(match, item, order),
        line,
    )
