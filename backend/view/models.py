from mongoengine import Document, EmbeddedDocument, fields

from container.models import Container
from datasource.models import DataSource
from workflow.models import Workflow

class PrimaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    type = fields.StringField(choices=('number', 'text'), required=True)
    datasource = fields.ReferenceField(DataSource, required=True)

class SecondaryColumn(EmbeddedDocument):
    field = fields.StringField(required=True)
    label = fields.StringField()
    type = fields.StringField(choices=('number', 'text', 'date'), required=True)
    datasource = fields.ReferenceField(DataSource, required=True)
    matchesWith = fields.StringField(required=True)

class DefaultMatchingField(EmbeddedDocument):
    field = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource, required=True)

class DropDescrepencies(EmbeddedDocument):
    field = fields.StringField(required=True)
    datasource = fields.ReferenceField(DataSource, required=True)
    shouldDrop = fields.BooleanField(required=True)

class View(Document):
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    workflow = fields.ReferenceField(Workflow, reverse_delete_rule=2) # Cascade delete if workflow is deleted
    primaryColumn = fields.EmbeddedDocumentField(PrimaryColumn, required=True)
    secondaryColumns = fields.EmbeddedDocumentListField(SecondaryColumn)
    defaultMatchingFields = fields.EmbeddedDocumentListField(DefaultMatchingField)
    dropDescrepencies = fields.EmbeddedDocumentListField(DropDescrepencies)
