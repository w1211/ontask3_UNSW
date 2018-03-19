from mongoengine import Document, EmbeddedDocument, fields

from container.models import Container
from datasource.models import DataSource

class Column(EmbeddedDocument):
    field = fields.StringField(required=True)
    label = fields.StringField(null=True)
    type = fields.StringField(choices=('number', 'text', 'date'), required=True)
    datasource = fields.StringField(required=True)
    matching = fields.StringField(null=True)

class DefaultMatchingField(EmbeddedDocument):
    matching = fields.StringField(required=True)
    datasource = fields.StringField(required=True)

class DropDiscrepencies(EmbeddedDocument):
    matching = fields.StringField(required=True)
    datasource = fields.StringField(required=True)
    dropMatching = fields.BooleanField()
    dropPrimary = fields.BooleanField()

class View(Document):
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = fields.StringField(required=True)
    columns = fields.EmbeddedDocumentListField(Column)
    defaultMatchingFields = fields.EmbeddedDocumentListField(DefaultMatchingField)
    dropDiscrepencies = fields.EmbeddedDocumentListField(DropDiscrepencies)
    data = fields.ListField(fields.DictField())
