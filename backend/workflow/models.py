from mongoengine import Document, EmbeddedDocument, fields

from datasource.models import DataSource
from container.models import Container


# Details
class PrimaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    type = fields.StringField(choices=('number', 'text'))
    datasource = fields.ReferenceField(DataSource, required=True)

class SecondaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    type = fields.StringField(choices=('number', 'text', 'date'))
    datasource = fields.ReferenceField(DataSource)
    matchesWith = fields.StringField()
    isCustom = fields.BooleanField()

class Details(EmbeddedDocument):
    primaryColumn = fields.EmbeddedDocumentField(PrimaryColumn, required=True)
    secondaryColumns = fields.EmbeddedDocumentListField(SecondaryColumn)

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
    startDate = fields.DateTimeField(required=True)
    endDate = fields.DateTimeField(required=True)
    time = fields.DateTimeField(required=True) #hour and minutes
    frequency = fields.IntField(min_value=1, required=True) #day

# Workflow
class Workflow(Document):
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = fields.StringField(required=True, unique_with='container')
    description = fields.StringField(null=True)
    details = fields.EmbeddedDocumentField(Details)
    filter = fields.StringField(null=True)
    conditionGroups = fields.EmbeddedDocumentListField(ConditionGroup)
    content = fields.StringField()
    schedule = fields.EmbeddedDocumentField(Schedule, null=True, required=False)
