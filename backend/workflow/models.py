from mongoengine import Document, EmbeddedDocument, fields

from matrix.models import Matrix


class Condition(EmbeddedDocument):
    name = fields.StringField(required=True)
    formula = fields.StringField(required=True)

class ConditionGroup(EmbeddedDocument):
    name = fields.StringField(required=True)
    conditions = fields.EmbeddedDocumentListField(Condition)

class Workflow(Document):
    owner = fields.IntField()
    name = fields.StringField(required=True)#, unique_with='matrix')
    matrix = fields.ReferenceField(Matrix, required=True, reverse_delete_rule=2) # Cascade delete if matrix is deleted
    filter = fields.StringField(null=True)
    conditionGroups = fields.EmbeddedDocumentListField(ConditionGroup)