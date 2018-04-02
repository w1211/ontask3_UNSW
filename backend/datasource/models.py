from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument, fields
from datetime import datetime

from container.models import Container


class Connection(EmbeddedDocument):
    dbType = fields.StringField(choices=('mysql', 'postgresql', 'sqlite', 'mssql', 'csvTextFile', 'xlsXlsxFile', 's3BucketFile'), required=True)
    host = fields.StringField()
    database = fields.StringField()
    user = fields.StringField()
    password = fields.StringField()
    query = fields.StringField()

class Schedule(EmbeddedDocument):
    startDate = fields.DateTimeField(required=True)
    endDate = fields.DateTimeField(required=True)
    time = fields.DateTimeField(required=True) #hour and minutes
    frequency = fields.IntField(min_value=1, required=True) #day
    frequencyUnit = fields.StringField(required=True)
    dayOfWeek = fields.StringField()
    dayOfMonth = fields.DateTimeField()

class DataSource(Document):
    # Owner of the datasource can be determined from container.owner
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = fields.StringField(required=True)
    connection = fields.EmbeddedDocumentField(Connection)
    data = fields.ListField(fields.DictField())
    schedule = fields.EmbeddedDocumentField(Schedule, null=True)
    lastUpdated = fields.DateTimeField(default=datetime.now)    
    fields = fields.ListField(fields.StringField())