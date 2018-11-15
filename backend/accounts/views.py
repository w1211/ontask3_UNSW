from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.status import HTTP_401_UNAUTHORIZED, HTTP_400_BAD_REQUEST

from django.shortcuts import redirect
from django.contrib.auth import authenticate, get_user_model
from django.db.utils import IntegrityError

from pylti.common import LTIException, verify_request_common
from jwt import decode
import os

from .models import OneTimeToken
from .utils import (
    get_or_create_user,
    generate_one_time_token,
    seed_data,
    user_signup_notification,
)

from ontask.settings import SECRET_KEY, AAF_CONFIG, LTI_CONFIG, FRONTEND_DOMAIN

User = get_user_model()


class LocalAuth(APIView):
    permission_classes = (AllowAny,)

    def put(self, request, format=None):
        is_production = not (
            os.environ.get("ONTASK_DEMO") or os.environ.get("ONTASK_DEVELOPMENT")
        )
        if is_production:
            return Response(
                {"error": "User registration is disabled"}, status=HTTP_400_BAD_REQUEST
            )

        credentials = {
            "email": request.data["email"],
            "password": request.data["password"],
            "name": request.data["fullname"],
        }

        try:
            user = User.objects.create_user(**credentials)
        except IntegrityError:
            return Response(
                {"error": "Email is already being used"}, status=HTTP_400_BAD_REQUEST
            )

        # Give the user a container with example datasources, datalabs, actions, etc
        seed_data(user)

        # Send a notification to admins on user signup, if OnTask is in demo mode
        user_signup_notification(user)

        return Response({"success": "User creation successful"})

    def post(self, request, format=None):
        credentials = {
            "username": request.data["email"],
            "password": request.data["password"],
        }
        user = authenticate(**credentials)

        if not user:
            return Response(
                {"error": "Invalid credentials"}, status=HTTP_401_UNAUTHORIZED
            )

        long_term_token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": str(long_term_token), "email": user.email})


class AAFAuth(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, format=None):
        # Decrypt the payload sent by AAF
        try:
            verified_jwt = decode(
                request.data["assertion"],
                AAF_CONFIG["secret_key"],
                issuer=AAF_CONFIG["aaf.edu.au"]["iss"],
                audience=AAF_CONFIG["aaf.edu.au"]["aud"],
            )
        except:
            return Response(
                {"error": "Invalid AAF token"}, status=HTTP_401_UNAUTHORIZED
            )

        user_attributes = verified_jwt["https://aaf.edu.au/attributes"]
        email = user_attributes["mail"]
        fullname = user_attributes["displayname"]

        user = get_or_create_user(email, fullname)

        # Update the user's role to staff if necessary
        roles = user_attributes["edupersonscopedaffiliation"][0].split(";")
        if (
            any(role in AAF_CONFIG["role_mappings"]["staff"] for role in roles)
            and not user.is_staff
        ):
            user.is_staff = True
            user.save()

        token = generate_one_time_token(user)

        return redirect(FRONTEND_DOMAIN + "?tkn=" + token)


class LTIAuth(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, format=None):
        url = request.build_absolute_uri()
        consumers = LTI_CONFIG["consumers"]
        method = request.method
        headers = request.META
        payload = request.POST.dict()

        # Verify that the payload received from LTI is valid
        try:
            verify_request_common(consumers, url, method, headers, payload)
        # If not, redirect to the error page
        # This page would be displayed in an iframe on Moodle
        except LTIException:
            # TODO: Implement logging of this error
            return redirect(FRONTEND_DOMAIN + "/error")

        email = payload["lis_person_contact_email_primary"]
        fullname = payload["lis_person_name_full"]

        user = get_or_create_user(email, fullname)
        token = generate_one_time_token(user)

        return redirect(FRONTEND_DOMAIN + "?tkn=" + token)


class ValidateOneTimeToken(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, format=None):
        one_time_token = request.data["token"]

        # Validate the token
        try:
            decrypted_token = decode(one_time_token, SECRET_KEY, algorithms=["HS256"])
        except:
            return Response(
                {"error": "Invalid AAF token"}, status=HTTP_401_UNAUTHORIZED
            )

        # Ensure that the token exists in the one time token table
        # Otherwise it must have already been used
        try:
            token = OneTimeToken.objects.get(token=one_time_token)
        except:
            return Response(
                {"error": "Token already used"}, status=HTTP_401_UNAUTHORIZED
            )

        # Delete the one time token so that it cannot be used again
        token.delete()

        # Get the user from the one time token
        user = User.objects.get(id=decrypted_token["id"])

        # Get or create a long term token for this user
        long_term_token, _ = Token.objects.get_or_create(user=user)

        return Response({"token": str(long_term_token), "email": user.email})
