from rest_framework.response import Response
from rest_framework.status import HTTP_403_FORBIDDEN, HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.shortcuts import redirect

from .models import OneTimeToken

import jwt
from datetime import datetime, timedelta
from ontask.settings import SECRET_KEY, DOMAIN


class AuthRouter(object):
    ''' Generic method wrapper for handling user login'''
    def authenticate(self, request, auth_wrapper_object):
        try:
            user = auth_wrapper_object.authenticate_user(request.data)

            # Check for invalid user login
            if user == "NOT_AUTHORIZED":
                return Response({"error": "Not Authorized"}, status=HTTP_403_FORBIDDEN)
            elif user == "EXPIRED_SIGNATURE":
                return Response({"error": "Expired Signature"}, status=HTTP_403_FORBIDDEN)
            elif not user:
                return Response({"error": "Login failed"}, status=HTTP_401_UNAUTHORIZED)

            # Check for a valid user login
            if user:
                # # Create a long-term access token for the user
                # token, _ = Token.objects.get_or_create(user=user)
                # Create a one-time, short expiry token to be sent as a querystring to the frontend
                # This token is used by the frontend to securely receive a long-term token by initiating a POST request
                iat = datetime.utcnow()
                exp = iat + timedelta(seconds=30)
                token = jwt.encode({ 'id': user.id, 'iat': iat, 'exp': exp }, SECRET_KEY, algorithm='HS256')
                token = token.decode("utf-8")
                # Add the token to the database in order to validate any incoming tokens
                OneTimeToken.objects(user=user.id).update_one(token=token, upsert=True)

                return redirect(DOMAIN + '?tkn=' + token)

        except Exception as e:
            # TODO logging
            return Response({"error": "Failure during login process"}, status=HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"error": "Login process encountered an unexpected failure"}, status=HTTP_500_INTERNAL_SERVER_ERROR)
        