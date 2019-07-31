from mongoengine import Document, EmbeddedDocument
from mongoengine.fields import ListField, StringField, IntField, EmbeddedDocumentField


class Container(Document):
    owner = StringField()  # User's email
    sharing = ListField(StringField())  # List of user emails
    code = StringField(required=True)
    school = StringField(null=True)
    faculty = StringField(null=True)
    description = StringField(null=True)
    lti_resource = StringField(null=True)
    lti_context = StringField(null=True)

    def has_full_permission(self, user):
        return user.email == self.owner or user.email in self.sharing

    def is_owner(self, user):
        return user.email == self.owner
