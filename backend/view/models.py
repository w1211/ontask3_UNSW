from mongoengine import Document, EmbeddedDocument, fields

from container.models import Container
from datasource.models import DataSource
from workflow.models import Workflow

class Column(EmbeddedDocument):
    field = fields.StringField(required=True)
    label = fields.StringField()
    type = fields.StringField(choices=('number', 'text', 'date'), required=True)
    datasource = fields.ReferenceField(DataSource, required=True)
    matching = fields.StringField()

class DefaultMatchingField(EmbeddedDocument):
    matching = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource, required=True)

class DropDiscrepencies(EmbeddedDocument):
    matching = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource, required=True)
    dropMatching = fields.BooleanField()
    dropPrimary = fields.BooleanField()

class View(Document):
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    workflow = fields.ReferenceField(Workflow, reverse_delete_rule=2) # Cascade delete if workflow is deleted
    columns = fields.EmbeddedDocumentListField(Column)
    defaultMatchingFields = fields.EmbeddedDocumentListField(DefaultMatchingField)
    dropDiscrepencies = fields.EmbeddedDocumentListField(DropDiscrepencies)
