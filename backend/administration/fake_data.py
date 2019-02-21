from faker import Faker
from django.contrib.auth import get_user_model


def fake_users():
    User = get_user_model()

    fake = Faker()

    for _ in range(300):
        try:
            User.objects.create(email=fake.email(), name=fake.name())
        except:
            continue
