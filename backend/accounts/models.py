from mongoengine import Document, fields


class OneTimeToken(Document):
    user = fields.StringField()
    token = fields.StringField()
