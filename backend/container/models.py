from mongoengine import Document, fields


class Container(Document):
    owner = fields.IntField()
    sharedWith = fields.ListField(fields.IntField()) # List of user ids
    code = fields.StringField(required=True)
    title = fields.StringField(required=True)
    school = fields.StringField(null=True)
    faculty = fields.StringField(null=True)
    description = fields.StringField(required=True)