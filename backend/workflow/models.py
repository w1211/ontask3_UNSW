from mongoengine import Document, EmbeddedDocument, fields

from container.models import Container
from view.models import View

# Condition groups
class Formula(EmbeddedDocument):
    field = fields.StringField()
    operator = fields.StringField()
    comparator = fields.StringField()

class Condition(EmbeddedDocument):
    name = fields.StringField(required=True)
    type = fields.StringField(choices=('and', 'or'), default='and')
    formulas = fields.EmbeddedDocumentListField(Formula)

class ConditionGroup(EmbeddedDocument):
    name = fields.StringField(required=True)
    conditions = fields.EmbeddedDocumentListField(Condition)

# Action
class Content(EmbeddedDocument):
    html = fields.StringField(null=True)
    plain = fields.StringField(null=True)

class Schedule(EmbeddedDocument):
    startTime = fields.DateTimeField()
    endTime = fields.DateTimeField()    
    time = fields.DateTimeField(required=True)
    frequency = fields.StringField(required=True, choices=('daily', 'weekly', 'monthly'))
    dayFrequency = fields.IntField(min_value=1) # I.e. every n days
    dayOfWeek = fields.ListField(fields.StringField()) # List of shorthand day names, e.g. ['mon', 'wed', 'fri']
    dayOfMonth = fields.DateTimeField() # Number representing the date in the month, e.g. 1 is the 1st
    taskName = fields.StringField() # The name of the celery task
    asyncTasks = fields.ListField(fields.StringField()) # async tasks

class EmailSettings(EmbeddedDocument):
    subject = fields.StringField(required=True)
    field = fields.StringField(required=True)
    replyTo = fields.StringField(required=True)

# Workflow
class Workflow(Document):
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    view = fields.ReferenceField(View, required=True, reverse_delete_rule=2) # Cascade delete if view is deleted
    name = fields.StringField(required=True, unique_with='container')
    description = fields.StringField(null=True)
    filter = fields.EmbeddedDocumentField(Condition)
    filtered_count = fields.IntField(null=True)
    conditionGroups = fields.EmbeddedDocumentListField(ConditionGroup)
    content = fields.EmbeddedDocumentField(Content)
    emailSettings = fields.EmbeddedDocumentField(EmailSettings)
    schedule = fields.EmbeddedDocumentField(Schedule, null=True, required=False)
    linkId = fields.StringField(null=True)#link_id is unique across workflow objects
