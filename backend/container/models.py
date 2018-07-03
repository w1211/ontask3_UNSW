from mongoengine import Document, EmbeddedDocument
from mongoengine.fields import ListField, StringField, IntField, EmbeddedDocumentField


class Container(Document):
    owner = StringField()  # User's email
    sharing = ListField(StringField())  # List of user emails
    code = StringField(required=True)
    school = StringField(null=True)
    faculty = StringField(null=True)
    description = StringField(null=True)
