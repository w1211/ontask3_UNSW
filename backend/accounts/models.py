from mongoengine import Document
from mongoengine.fields import ReferenceField, StringField, DictField
from django.contrib.auth.models import AbstractUser
from django.db import models


class OneTimeToken(Document):
    user = StringField()
    token = StringField()


class lti(Document):
    user = StringField()
    payload = DictField()


class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    @property
    def permission_values(self):
        values = [self.email]

        try:
            lti_payload = lti.objects.get(user=self.id).payload
            values.extend(lti_payload.values())
        except:
            pass

        return values
