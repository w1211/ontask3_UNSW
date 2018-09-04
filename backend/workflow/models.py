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
    BooleanField,
    SequenceField,
    ObjectIdField,
)
from bson import ObjectId
from datetime import datetime

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


class Option(EmbeddedDocument):
    label = StringField(required=True)
    value = StringField(required=True)


class EmailSettings(EmbeddedDocument):
    subject = StringField(required=True)
    field = StringField(required=True)
    replyTo = StringField(required=True)
    include_feedback = BooleanField()
    feedback_list = BooleanField()
    list_question = StringField()
    list_options = EmbeddedDocumentListField(Option)
    list_type = StringField(choices=("dropdown", "radio"))
    feedback_textbox = BooleanField()
    textbox_question = StringField()


class Email(EmbeddedDocument):
    recipient = StringField()
    content = StringField()
    list_feedback = StringField()
    textbox_feedback = StringField()
    feedback_datetime = DateTimeField()
    track_count = IntField(default=0)
    first_tracked = DateTimeField()
    last_tracked = DateTimeField()


class EmailJob(EmbeddedDocument):
    job_id = ObjectIdField()
    subject = StringField()
    emails = EmbeddedDocumentListField(Email)
    type = StringField(choices=["Manual", "Scheduled"])
    initiated_at = DateTimeField(default=datetime.utcnow)
    included_feedback = BooleanField()


# Workflow
class Workflow(Document):
    container = ReferenceField(
        Container, required=True, reverse_delete_rule=2
    )  # Cascade delete if container is deleted
    datalab = ReferenceField(
        Datalab, required=True, reverse_delete_rule=2
    )  # Cascade delete if view is deleted
    name = StringField(required=True)
    description = StringField(null=True)
    filter = EmbeddedDocumentField(Condition)
    conditionGroups = EmbeddedDocumentListField(ConditionGroup)
    content = DictField(null=True)
    html = ListField(StringField())
    emailSettings = EmbeddedDocumentField(EmailSettings)
    schedule = EmbeddedDocumentField(Schedule, null=True, required=False)
    linkId = StringField(null=True)  # link_id is unique across workflow objects
    emailJobs = EmbeddedDocumentListField(EmailJob)
