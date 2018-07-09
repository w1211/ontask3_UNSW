from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument, fields
from datetime import datetime

from container.models import Container


class Connection(EmbeddedDocument):
    dbType = fields.StringField(choices=('mysql', 'postgresql', 'sqlite',
                                         'mssql', 'csvTextFile', 'xlsXlsxFile', 's3BucketFile'), required=True)
    host = fields.StringField()
    port = fields.IntField()
    database = fields.StringField()
    user = fields.StringField()
    password = fields.StringField()
    query = fields.StringField()
    sheetname = fields.StringField()
    delimiter = fields.StringField()
    bucket = fields.StringField()
    fileName = fields.StringField()


class Schedule(EmbeddedDocument):
    startTime = fields.DateTimeField()
    endTime = fields.DateTimeField()
    time = fields.DateTimeField(required=True)
    frequency = fields.StringField(
        required=True, choices=('daily', 'weekly', 'monthly'))
    dayFrequency = fields.IntField(min_value=1)  # I.e. every n days
    # List of shorthand day names, e.g. ['mon', 'wed', 'fri']
    dayOfWeek = fields.ListField(fields.StringField())
    # Number representing the date in the month, e.g. 1 is the 1st
    dayOfMonth = fields.DateTimeField()
    taskName = fields.StringField()  # The name of the celery task
    asyncTasks = fields.ListField(fields.StringField())  # Async tasks


class Datasource(Document):
    # Owner of the datasource can be determined from container.owner
    # Cascade delete if container is deleted
    container = fields.ReferenceField(
        Container, required=True, reverse_delete_rule=2)
    name = fields.StringField(required=True)
    connection = fields.EmbeddedDocumentField(Connection)
    data = fields.ListField(fields.DictField())
    schedule = fields.EmbeddedDocumentField(Schedule, null=True)
    # Last time the data was updated
    lastUpdated = fields.DateTimeField(default=datetime.utcnow)
    fields = fields.ListField(fields.StringField())
