from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument, fields


class Connection(EmbeddedDocument):
    dbType = fields.StringField(choices=('mysql', 'postgresql', 'sqlite', 'mssql'), required=True)
    host = fields.StringField(required=True)
    database = fields.StringField(required=True)
    user = fields.StringField(required=True)
    # TO DO: do not store db password as plaintext!
    password = fields.StringField(required=True)
    query = fields.StringField(required=True)

class Metadata(EmbeddedDocument):
    name = fields.StringField(required=True)
    isDynamic = fields.BooleanField(required=True)
    updateFrequency = fields.StringField(choices=('', 'hourly', 'daily', 'weekly'), required=True) # Weekly = 7 days from lastUpdated
    lastUpdated = fields.DateTimeField()

class DataSource(Document):
    owner = fields.IntField()
    sharedWith = fields.ListField(fields.IntField()) # List of user ids
    connection = fields.EmbeddedDocumentField(Connection)
    metadata = fields.EmbeddedDocumentField(Metadata)
    data = fields.ListField(fields.DictField())