from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.authtoken.models import Token
from rest_framework.status import HTTP_401_UNAUTHORIZED, HTTP_400_BAD_REQUEST, HTTP_200_OK
from rest_framework.exceptions import NotFound, PermissionDenied

from django.contrib.auth.models import Group
from django.shortcuts import redirect
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import Group
from django.db.utils import IntegrityError
from django.urls import reverse

from pylti.common import LTIException, verify_request_common
from jwt import decode
import os

from .models import OneTimeToken, lti
from .utils import (
    get_or_create_user,
    generate_one_time_token,
    seed_data,
    user_signup_notification,
)


from container.models import Container

from ontask.settings import (
    SECRET_KEY,
    AAF_CONFIG,
    LTI_CONFIG,
    BACKEND_DOMAIN,
    FRONTEND_DOMAIN,
)

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

        if User.objects.filter(email=request.data["email"]).first():
            return Response(
                {"error": "Email is already being used"}, status=HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(**request.data)
        if os.environ.get("ONTASK_DEMO"):
            user.groups.add(Group.objects.get(name="instructor"))
        else:
            user.groups.add(Group.objects.get(name="user"))
            
        # Give the user a container with example datasources, datalabs, actions, etc
        # seed_data(user)

        # Send a notification to admins on user signup, if OnTask is in demo mode
        user_signup_notification(user)

        return Response({"success": "User creation successful"})

    def post(self, request, format=None):
        user = authenticate(**request.data)
        if not user:
            return Response(
                {"error": "Invalid credentials"}, status=HTTP_401_UNAUTHORIZED
            )

        long_term_token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": str(long_term_token),
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}",
                "group": ",".join([group.name for group in user.groups.all()]),
            }
        )


class AAFAuth(APIView):
    permission_classes = (AllowAny,)

    def head(self, request, format=None):
        return Response()

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
        data = {
            "email": user_attributes["mail"],
            "first_name": user_attributes["givenname"],
            "last_name": user_attributes["surname"],
        }
        user = get_or_create_user(data)

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
        url = f"{BACKEND_DOMAIN}{reverse('lti')}"
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
            return redirect(FRONTEND_DOMAIN + "/forbidden")

        data = {
            "email": payload["lis_person_contact_email_primary"],
            "first_name": payload["lis_person_name_given"],
            "last_name": payload["lis_person_name_family"],
        }
        user = get_or_create_user(data)

        # Elevate the user to instructor group if they have a staff role in LTI
        # If they are already instructor or admin, then do nothing
        user_groups = [group.name for group in user.groups.all()]
        is_lti_instructor = payload["roles"] == LTI_CONFIG.get("staff_role")
        if "user" in user_groups and is_lti_instructor:
            user.groups.set([Group.objects.get(name="instructor")])

        token = generate_one_time_token(user)

        # Store the important LTI fields for this user
        # These fields be used to grant permissions in containers
        lti_payload = {
            "user_id": payload["user_id"],
            "ext_user_username": payload["ext_user_username"],
            "lis_person_contact_email_primary": payload[
                "lis_person_contact_email_primary"
            ],
        }
        lti.objects(user=user.id).update_one(payload=lti_payload, upsert=True)

        # If any containers have been bound to this LTI resource, then
        # redirect to that container
        # Otherwise, prompt the user to choose a container for binding
        lti_resource_id = payload["resource_link_id"]
        try:
            container = Container.objects.get(lti_resource=lti_resource_id)
            return redirect(
                FRONTEND_DOMAIN + "?tkn=" + token + "&container=" + str(container.id)
            )
        except:
            return redirect(
                FRONTEND_DOMAIN + "?tkn=" + token + "&lti=" + lti_resource_id
            )


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

        return Response(
            {
                "token": str(long_term_token),
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}",
                "group": ",".join([group.name for group in user.groups.all()]),
            }
        )


class ImpersonateUser(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, email):
        try:
            return User.objects.get(email=email)
        except:
            raise NotFound()

    def post(self, request):
        email = request.data.get("email")
        user = self.get_object(email)

        if user.is_staff:
            raise PermissionDenied()
        
        long_term_token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": str(long_term_token),
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}",
                "group": ",".join([group.name for group in user.groups.all()])
            },
            status=HTTP_200_OK
        )
