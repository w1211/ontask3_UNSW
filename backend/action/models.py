from mongoengine import Document, EmbeddedDocument, fields

from workflow.models import Workflow

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

class Action(Document):
    workflow = fields.ReferenceField(Workflow, required=True, reverse_delete_rule=2) # Cascade delete if workflow is deleted
    name = fields.StringField(required=True, unique_with='workflow')
    description = fields.StringField(null=True)
    filter = fields.StringField(null=True)
    conditionGroups = fields.EmbeddedDocumentListField(ConditionGroup)