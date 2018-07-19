from mongoengine import Document, EmbeddedDocument, fields
from mongoengine.fields import (
    ReferenceField,
    EmbeddedDocumentField,
    EmbeddedDocumentListField,
    StringField,
    DateTimeField,
    IntField,
    ListField,
    DictField,
)

from container.models import Container
from datalab.models import Datalab

# Condition groups
class Formula(EmbeddedDocument):
    field = StringField()
    operator = StringField()
    comparator = StringField()


class Condition(EmbeddedDocument):
    name = StringField(required=True)
    type = StringField(choices=("and", "or"), default="and")
    formulas = EmbeddedDocumentListField(Formula)


class ConditionGroup(EmbeddedDocument):
    name = StringField(required=True)
    conditions = EmbeddedDocumentListField(Condition)


# Action
class Content(EmbeddedDocument):
    html = StringField(null=True)
    plain = StringField(null=True)


class Schedule(EmbeddedDocument):
    startTime = DateTimeField()
    endTime = DateTimeField()
    time = DateTimeField(required=True)
    frequency = StringField(required=True, choices=("daily", "weekly", "monthly"))
    dayFrequency = IntField(min_value=1)  # I.e. every n days
    dayOfWeek = ListField(
        StringField()
    )  # List of shorthand day names, e.g. ['mon', 'wed', 'fri']
    dayOfMonth = (
        DateTimeField()
    )  # Number representing the date in the month, e.g. 1 is the 1st
    taskName = StringField()  # The name of the celery task
    asyncTasks = ListField(StringField())  # async tasks


class EmailSettings(EmbeddedDocument):
    subject = StringField(required=True)
    field = StringField(required=True)
    replyTo = StringField(required=True)


# Workflow
class Workflow(Document):
    container = ReferenceField(
        Container, required=True, reverse_delete_rule=2
    )  # Cascade delete if container is deleted
    datalab = ReferenceField(
        Datalab, required=True, reverse_delete_rule=2
    )  # Cascade delete if view is deleted
    name = StringField(required=True, unique_with="container")
    description = StringField(null=True)
    filter = EmbeddedDocumentField(Condition)
    filtered_count = IntField(null=True)
    conditionGroups = EmbeddedDocumentListField(ConditionGroup)
    content = DictField(null=True)
    emailSettings = EmbeddedDocumentField(EmailSettings)
    schedule = EmbeddedDocumentField(Schedule, null=True, required=False)
    linkId = StringField(null=True)  # link_id is unique across workflow objects
