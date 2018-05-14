from mongoengine import Document, EmbeddedDocument
from mongoengine.fields import StringField, DictField, ListField, EmbeddedDocumentListField,\
                                ReferenceField, BooleanField, EmbeddedDocumentField, DateTimeField

from container.models import Container
from datasource.models import DataSource


class Discrepencies(EmbeddedDocument):
    matching = BooleanField()
    primary = BooleanField()

class Option(EmbeddedDocument):
    label = StringField(required=True)
    value = StringField(required=True)

class Field(EmbeddedDocument):
    name = StringField(required=True)
    type = StringField(required=True)
    textArea = BooleanField(null=True)
    options = EmbeddedDocumentListField(Option)

class DatasourceModule(EmbeddedDocument):
    id = StringField(required=True)
    primary = StringField(required=True)
    matching = StringField(null=True)
    fields = ListField(StringField())
    labels = DictField()
    types = DictField()

class FormModule(EmbeddedDocument):
    name = StringField(required=True)
    activeFrom = DateTimeField(null=True)
    activeTo = DateTimeField(null=True)
    fields = EmbeddedDocumentListField(Field, required=True)
    data = ListField(DictField())
    
class Module(EmbeddedDocument):
    type = StringField(choices=('datasource', 'computed', 'form'), required=True)
    discrepencies = EmbeddedDocumentField(Discrepencies)
    datasource = EmbeddedDocumentField(DatasourceModule)
    form = EmbeddedDocumentField(FormModule)

class View(Document):
    container = ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = StringField(required=True)
    steps = EmbeddedDocumentListField(Module)
    data = ListField(DictField())
