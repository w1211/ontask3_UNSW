import re
from rest_framework_mongoengine.validators import ValidationError

from bson import ObjectId
import jwt
from .models import EmailSettings, EmailJob, Email
from ontask.settings import SECRET_KEY, BACKEND_DOMAIN, FRONTEND_DOMAIN
from scheduler.utils import send_email


def did_pass_formula(item, formula):
    operator = formula["operator"]
    comparator = formula["comparator"]

    try:
        value = item[formula["field"]]
    except KeyError:
        # This record must not have a value for this field
        return False

    if operator == "==":
        return value == comparator
    elif operator == "!=":
        return value != comparator
    elif operator == "<":
        return value < comparator
    elif operator == "<=":
        return value <= comparator
    elif operator == ">":
        return value > comparator
    elif operator == ">=":
        return value >= comparator


def evaluate_filter(data, filter):
    if not filter:
        return data

    filtered_data = list()

    # Iterate over the rows in the data and return any rows which pass true
    for item in data:
        didPass = False

        if len(filter["formulas"]) == 1:
            if did_pass_formula(item, filter["formulas"][0]):
                didPass = True

        elif filter["type"] == "and":
            pass_counts = [
                did_pass_formula(item, formula) for formula in filter["formulas"]
            ]
            if sum(pass_counts) == len(filter["formulas"]):
                didPass = True

        elif filter["type"] == "or":
            pass_counts = [
                did_pass_formula(item, formula) for formula in filter["formulas"]
            ]
            if sum(pass_counts) > 0:
                didPass = True

        if didPass:
            filtered_data.append(item)

    return filtered_data


def validate_condition_group(steps, data, condition_group):
    fields = []
    for step in steps:
        if step["type"] == "datasource":
            step = step["datasource"]
            for field in step["fields"]:
                fields.append(step["labels"][field])

    for condition in condition_group["conditions"]:
        for formula in condition["formulas"]:

            # Parse the output of the field/operator cascader from the condition group form in the frontend
            # Only necessary if this is being called after a post from the frontend
            if "fieldOperator" in formula:
                formula["field"] = formula["fieldOperator"][0]
                formula["operator"] = formula["fieldOperator"][1]
                del formula["fieldOperator"]

            if formula["field"] not in fields:
                raise ValidationError(
                    "Invalid formula: field '{0}' does not exist in the workflow details".format(
                        formula["field"]
                    )
                )


def evaluate_condition_group(data, condition_group):
    conditions_passed = {
        condition["name"]: [] for condition in condition_group["conditions"]
    }

    # Iterate over the rows in the data and return any rows which pass true
    for item in data:
        # Ensure that each item passes the test for only one condition per condition group
        matchedCount = 0

        for condition in condition_group["conditions"]:
            didPass = False

            if len(condition["formulas"]) == 1:
                if did_pass_formula(item, condition["formulas"][0]):
                    didPass = True

            elif condition["type"] == "and":
                pass_counts = [
                    did_pass_formula(item, formula) for formula in condition["formulas"]
                ]
                if sum(pass_counts) == len(condition["formulas"]):
                    didPass = True

            elif condition["type"] == "or":
                pass_counts = [
                    did_pass_formula(item, formula) for formula in condition["formulas"]
                ]
                if sum(pass_counts) > 0:
                    didPass = True

            if didPass:
                conditions_passed[condition["name"]].append(item)
                matchedCount += 1

        if matchedCount > 1:
            raise ValidationError(
                "An item has matched with more than one condition in the condition group '{0}'".format(
                    condition_group["name"]
                )
            )

    return conditions_passed


def populate_field(match, item):
    field = match.group(1)
    if field in item:
        return str(item[field])
    else:
        return None


def parse_content_line(line, item):
    return re.sub(
        r"<attribute>(.*?)</attribute>", lambda match: populate_field(match, item), line
    )


def populate_content(
    datalab, filter, condition_groups, content, html, should_include_data=False
):
    filtered_data = evaluate_filter(datalab["data"], filter)

    all_conditions_passed = dict()
    # Combine all conditions from each condition group into a single dict
    for condition_group in condition_groups:
        validate_condition_group(datalab["steps"], filtered_data, condition_group)

        conditions_passed = evaluate_condition_group(filtered_data, condition_group)

        for condition in conditions_passed:
            all_conditions_passed[condition] = conditions_passed[condition]

    result = []
    if content and "document" in content and "nodes" in content["document"]:
        for item in filtered_data:
            populated_content = ""
            for index, block in enumerate(content["document"]["nodes"]):
                if block["type"] == "condition":
                    condition_name = block["data"]["name"]
                    if not condition_name in all_conditions_passed:
                        raise ValidationError(
                            "The condition '{0}' does not exist in any condition group for this action".format(
                                condition_name
                            )
                        )
                    if item in all_conditions_passed[condition_name]:
                        populated_content += parse_content_line(html[index], item)
                else:
                    populated_content += parse_content_line(html[index], item)

            result.append(populated_content)

    if should_include_data:
        return result, filtered_data

    return result


def perform_email_job(workflow, job_type, email_settings=None):
    if not email_settings:
        email_settings = workflow.emailSettings

    populated_content, data = populate_content(
        workflow.datalab,
        workflow.filter,
        workflow.conditionGroups,
        workflow.content,
        workflow.html,
        should_include_data=True,
    )

    job_id = ObjectId()
    job = EmailJob(
        job_id=job_id,
        subject=email_settings.subject,
        type=job_type,
        included_feedback=email_settings.include_feedback and True,
        emails=[],
    )

    failed_emails = False
    for index, item in enumerate(data):
        recipient = item[email_settings.field]
        email_content = populated_content[index]

        tracking_token = jwt.encode(
            {
                "workflow_id": str(workflow.id),
                "job_id": str(job_id),
                "recipient": recipient,
            },
            SECRET_KEY,
            algorithm="HS256",
        ).decode("utf-8")

        tracking_link = (
            f"{BACKEND_DOMAIN}/workflow/read_receipt/?email={tracking_token}"
        )
        tracking_pixel = f"<img src='{tracking_link}'/>"
        email_content += tracking_pixel

        if email_settings.include_feedback:
            feedback_link = (
                f"{FRONTEND_DOMAIN}/action/{workflow.id}/feedback/?job={job_id}"
            )
            email_content += (
                "<p>Did you find this correspondence useful? Please provide your "
                f"feedback by <a href='{feedback_link}'>clicking here</a>.</p>"
            )

        email_sent = send_email(
            recipient, email_settings.subject, email_content, email_settings.replyTo
        )

        if email_sent:
            job["emails"].append(
                Email(
                    recipient=recipient,
                    # Content without the tracking pixel
                    content=populated_content[index],
                )
            )
        # else:
        #     failed_emails = True

    # if failed_emails:
    # TODO: Make these records identifiable, e.g. allow user to specify the primary key of the DataLab?
    # And send back a list of the specific records that we failed to send an email to
    # raise ValidationError('Emails to the some records failed to send: ' + str(failed_emails).strip('[]').strip("'"))

    return job
