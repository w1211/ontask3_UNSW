from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument
from mongoengine.fields import (
    StringField,
    DictField,
    ListField,
    IntField,
    ReferenceField,
    EmbeddedDocumentField,
    DateTimeField,
)
from datetime import datetime

from container.models import Container


class Connection(EmbeddedDocument):
    dbType = StringField(
        choices=(
            "mysql",
            "postgresql",
            "sqlite",
            "mssql",
            "csvTextFile",
            "xlsXlsxFile",
            "s3BucketFile",
        ),
        required=True,
    )
    host = StringField()
    port = IntField()
    database = StringField()
    user = StringField()
    password = StringField()
    query = StringField()
    sheetname = StringField()
    delimiter = StringField()
    bucket = StringField()
    fileName = StringField()


class Schedule(EmbeddedDocument):
    startTime = DateTimeField()
    endTime = DateTimeField()
    time = DateTimeField(required=True)
    frequency = StringField(
        required=True, choices=("daily", "weekly", "monthly")
    )
    dayFrequency = IntField(min_value=1)  # I.e. every n days
    # List of shorthand day names, e.g. ['mon', 'wed', 'fri']
    dayOfWeek = ListField(StringField())
    # Number representing the date in the month, e.g. 1 is the 1st
    dayOfMonth = DateTimeField()
    taskName = StringField()  # The name of the celery task
    asyncTasks = ListField(StringField())  # Async tasks


class Datasource(Document):
    # Owner of the datasource can be determined from container.owner
    # Cascade delete if container is deleted
    container = ReferenceField(Container, required=True, reverse_delete_rule=2)
    name = StringField(required=True)
    connection = EmbeddedDocumentField(Connection)
    data = ListField(DictField())
    schedule = EmbeddedDocumentField(Schedule, null=True)
    # Last time the data was updated
    lastUpdated = DateTimeField(default=datetime.utcnow)
    fields = ListField(StringField())
    types = DictField()
