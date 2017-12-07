from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument, fields

from datasource.models import DataSource
from container.models import Container


class PrimaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    isInteger = fields.BooleanField(required=True) # User must specify whether the field is an integer or a string
    datasource = fields.ReferenceField(DataSource, required=True)

class SecondaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource)
    matchesWith = fields.StringField()
    isCustom = fields.BooleanField()

class Matrix(Document):
    owner = fields.IntField()
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = fields.StringField(required=True)
    primaryColumn = fields.EmbeddedDocumentField(PrimaryColumn, required=True)
    secondaryColumns = fields.EmbeddedDocumentListField(SecondaryColumn)