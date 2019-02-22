from mongoengine import Document
from mongoengine.fields import ReferenceField, StringField, DictField
from django.contrib.auth.models import AbstractUser, BaseUserManager, Group
from django.db import models


class OneTimeToken(Document):
    user = StringField()
    token = StringField()


class lti(Document):
    user = StringField()
    payload = DictField()


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        user = self._create_user(email, password, **extra_fields)
        user.groups.add(Group.objects.get(name="admin"))
        return user


class User(AbstractUser):
    username = models.CharField(max_length=40, db_index=False, unique=False, null=True)
    email = models.EmailField(unique=True, db_index=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def lti(self):
        lti_values = []
        try:
            lti_payload = lti.objects.get(user=self.id).payload
            lti_values.extend(lti_payload.values())
        except:
            pass
        return lti_values

    @property
    def permission_values(self):
        return [self.email] + self.lti
