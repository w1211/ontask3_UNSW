from mongoengine import Document
from mongoengine.fields import StringField, DictField, DateTimeField
from datetime import datetime


class Audit(Document):
    model = StringField(required=True)
    document = StringField(required=True)
    action = StringField(required=True)
    when = DateTimeField(default=datetime.utcnow)
    user = StringField(required=True)
    # Object describing the changes made to the document (if applicable)
    diff = DictField(null=True)
