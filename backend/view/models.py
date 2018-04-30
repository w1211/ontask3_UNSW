from mongoengine import Document, EmbeddedDocument
from mongoengine.fields import StringField, DictField, ListField, EmbeddedDocumentListField,\
                                ReferenceField, BooleanField, EmbeddedDocumentField

from container.models import Container
from datasource.models import DataSource


class DropDiscrepencies(EmbeddedDocument):
    matching = StringField(required=True)
    datasource = StringField(required=True)
    dropMatching = BooleanField()
    dropPrimary = BooleanField()

class DatasourceModule(EmbeddedDocument):
    id = StringField(required=True)
    primary = StringField(required=True)
    matching = StringField(null=True)
    fields = ListField(StringField())
    labels = DictField()
    
class Module(EmbeddedDocument):
    type = StringField(choices=('datasource', 'computed', 'form'), required=True)
    datasource = EmbeddedDocumentField(DatasourceModule)

class View(Document):
    container = ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = StringField(required=True)
    dropDiscrepencies = EmbeddedDocumentListField(DropDiscrepencies)
    steps = EmbeddedDocumentListField(Module)
    data = ListField(DictField())

