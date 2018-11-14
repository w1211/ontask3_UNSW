from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from passlib.hash import pbkdf2_sha256
from jwt import encode

from ontask.settings import SECRET_KEY

from .models import OneTimeToken


User = get_user_model()


def get_or_create_user(email, fullname):
    # Find the user based on the email provided in the payload
    # The user is implicitly being authenticated simply because we trust
    # the assertions received from AAF/LTI
    try:
        user = User.objects.get(email=email)
    # If the user doesn't exist, then create them
    except User.DoesNotExist:
        password = pbkdf2_sha256.hash(email)
        user = User.objects.create_user(email=email, password=password, name=fullname)

    return user


def generate_one_time_token(user):
    # Create a one-time, short expiry token to be sent as a querystring to the
    # frontend. This token is used by the frontend to securely receive a long-term
    # token by initiating a POST request
    iat = datetime.utcnow()
    exp = iat + timedelta(seconds=30)
    token = encode(
        {"id": user.id, "iat": iat, "exp": exp}, SECRET_KEY, algorithm="HS256"
    )
    token = token.decode("utf-8")

    # Add the token to the database in order to validate any incoming tokens
    OneTimeToken.objects(user=user.id).update_one(token=token, upsert=True)

    return token
