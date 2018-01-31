from rest_framework.response import Response
from rest_framework.status import HTTP_403_FORBIDDEN, HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.authtoken.models import Token
from django.contrib.auth import login

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
                login(request, user)
                token, _ = Token.objects.get_or_create(user=user)
                request.session['token'] = token.key
                return Response({"token": token.key, "name":user.name, "email":user.email})
        except Exception as e:
            # TODO logging
            return Response({"error": "Failure during login process"}, status=HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"error": "Login process encountered an unexpected failure"}, status=HTTP_500_INTERNAL_SERVER_ERROR)
