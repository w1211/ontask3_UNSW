from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument, fields
from datetime import datetime

from container.models import Container


class Connection(EmbeddedDocument):
    dbType = fields.StringField(choices=('mysql', 'postgresql', 'sqlite', 'mssql'), required=True)
    host = fields.StringField(required=True)
    database = fields.StringField(required=True)
    user = fields.StringField(required=True)
    password = fields.StringField(null=True)
    query = fields.StringField(required=True)

class Metadata(EmbeddedDocument):
    isDynamic = fields.BooleanField()
    updateFrequency = fields.StringField(choices=('hourly', 'daily', 'weekly')) # Weekly = 7 days from lastUpdated
    lastUpdated = fields.DateTimeField(default=datetime.now)

class DataSource(Document):
    # Owner of the datasource can be determined from container.owner
    container = fields.ReferenceField(Container, required=True, reverse_delete_rule=2) # Cascade delete if container is deleted
    name = fields.StringField(required=True, unique_with='container')    
    connection = fields.EmbeddedDocumentField(Connection)
    metadata = fields.EmbeddedDocumentField(Metadata)
    data = fields.ListField(fields.DictField())