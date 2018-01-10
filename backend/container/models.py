from mongoengine import Document, EmbeddedDocument, fields

class Sharing(EmbeddedDocument):
    readOnly = fields.ListField(fields.IntField()) # List of user ids
    readWrite = fields.ListField(fields.IntField()) # List of user ids

class Container(Document):
    owner = fields.IntField()
    sharing = fields.EmbeddedDocumentField(Sharing, default=Sharing)
    code = fields.StringField(required=True)
    school = fields.StringField(null=True)
    faculty = fields.StringField(null=True)
    description = fields.StringField(required=True)