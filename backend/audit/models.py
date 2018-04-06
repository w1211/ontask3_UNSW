import datetime
from mongoengine import Document, EmbeddedDocument, fields

from datasource.models import DataSource
from container.models import Container

class EmailSettings(EmbeddedDocument):
    subject = fields.StringField(null=True)
    field = fields.StringField(required=True)

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

class Schedule(EmbeddedDocument):
    startTime = fields.DateTimeField(required=True)
    endTime = fields.DateTimeField(required=True)
    time = fields.DateTimeField(required=True) #hour and minutes
    frequency = fields.IntField(min_value=1, required=True) #day

#Audit
#currently only creator, receiver, emailSubject, emailBody, timeStamp are in use
class Audit(Document):
    workflowId = fields.StringField(required=True)
    timeStamp = fields.DateTimeField(default=datetime.datetime.now)
    creator = fields.StringField(required=True)
    receiver = fields.StringField(required=True)
    emailSubject = fields.StringField(null=True, required=True)
    emailBody = fields.StringField(null=True, required=True)
    filter = fields.StringField()
    conditionGroups = fields.EmbeddedDocumentListField(ConditionGroup)
    emailSettings = fields.EmbeddedDocumentField(EmailSettings)
    schedule = fields.EmbeddedDocumentField(Schedule, null=True)
    