from mongoengine import Document, EmbeddedDocument, fields

from datasource.models import DataSource
from container.models import Container


# Matrix
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

class Matrix(EmbeddedDocument):
    name = fields.StringField(required=True)
    primaryColumn = fields.EmbeddedDocumentField(PrimaryColumn, required=True)
    secondaryColumns = fields.EmbeddedDocumentListField(SecondaryColumn)

# Workflow 
class Workflow(Document):
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = fields.StringField(required=True, unique_with='container')
    matrix = fields.EmbeddedDocumentField(Matrix)
