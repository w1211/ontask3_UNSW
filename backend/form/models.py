from mongoengine import Document, EmbeddedDocument
from mongoengine.fields import (
    StringField,
    DictField,
    ListField,
    EmbeddedDocumentListField,
    IntField,
    ReferenceField,
    BooleanField,
    DateTimeField,
    FloatField,
)

from container.models import Container
from datalab.models import Datalab


class Option(EmbeddedDocument):
    label = StringField(required=True)
    value = StringField(required=True)


class Field(EmbeddedDocument):
    name = StringField(required=True)
    type = StringField(required=True)
    textDisplay = StringField(null=True)
    textArea = BooleanField(null=True)
    maxLength = IntField(null=True)
    multiSelect = BooleanField(null=True)
    options = EmbeddedDocumentListField(Option)
    listStyle = StringField(null=True)
    alignment = StringField(null=True)
    minimum = IntField(null=True)
    maximum = IntField(null=True)
    precision = IntField(null=True)
    interval = FloatField(null=True)
    numberDisplay = StringField(null=True)
    useIcon = BooleanField(null=True)
    columns = ListField(StringField())

class Form(Document):
    container = ReferenceField(
        Container, required=True, reverse_delete_rule=2
    )  # Cascade delete if container is deleted
    datalab = ReferenceField(
        Datalab, required=True, reverse_delete_rule=2
    )  # Cascade delete if view is deleted
    name = StringField(required=True)
    description = StringField(null=True)
    primary = StringField(required=True)
    visibleFields = ListField(StringField())
    fields = EmbeddedDocumentListField(Field, required=True)
    layout = StringField(choices=("vertical", "table"), default="table")
    activeFrom = DateTimeField(null=True)
    activeTo = DateTimeField(null=True)
    ltiAccess = BooleanField(default=False)
    emailAccess = BooleanField(default=False)
    permission = StringField(null=True)
    data = ListField(DictField())
    permitted_users = ListField(StringField())
    restriction = StringField(choices=("private", "limited", "open"), default="private")

    # Flat representation of which users should see this form when they load the dashboard
    def refresh_access(self):
        users = set(record.get(self.permission) for record in self.datalab.relations)
        if None in users:
            users.remove(None)

        self.permitted_users = list(users)
        self.save()
