from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument, fields

from datasource.models import DataSource


class PrimaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource, required=True)

class SecondaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource)
    matchesWith = fields.StringField()
    isCustom = fields.BooleanField()

class Matrix(Document):
    owner = fields.IntField()
    sharedWith = fields.ListField(fields.IntField()) # List of user ids
    name = fields.StringField(required=True)
    primaryColumn = fields.EmbeddedDocumentField(PrimaryColumn, required=True)
    secondaryColumns = fields.EmbeddedDocumentListField(SecondaryColumn)