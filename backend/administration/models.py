from mongoengine import Document
from mongoengine.fields import ListField, ReferenceField, StringField, DateTimeField

from datalab.models import Datalab


class Dump(Document):
    # Cascade delete if datalab is deleted
    task_name = StringField()
    datalabs = ListField(ReferenceField(Datalab, reverse_delete_rule=2))
    last_run = DateTimeField()
