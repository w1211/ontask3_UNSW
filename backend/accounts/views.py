''' VIEWS FOR USER AUTHENTICATION '''
from __future__ import unicode_literals
from rest_framework.views import APIView
from .auth_wrapper import AAFAuthHandler, LTIAuthHandler
from .auth_router import AuthRouter
from rest_framework.response import Response

import jwt
from ontask.settings import SECRET_KEY
from .models import OneTimeToken
from django.contrib.auth.models import User


class AAFAuthRouter(APIView):
    '''Hosts the logic to handle the post request from AAF and authenticate the
    user to the application'''

    authentication_classes = ()
    permission_classes = ()
    def post(self, request, format=None):
        '''Handles the post request from AAF Rapid Connect and routes the user
        to the landing page of the application'''
        aaf_authhandler = AAFAuthHandler()
        auth_router = AuthRouter()
        return auth_router.authenticate(request, aaf_authhandler)
      
class LTIAuthRouter(APIView):
    '''Hosts the logic to handle the post request from LTI and authenticate the
    user to the application'''

    authentication_classes = ()
    permission_classes = ()
    def post(self, request, format=None):
        '''Handles the post request from LTI and routes the user
        to the landing page of the application'''
        lti_authhandler = LTIAuthHandler()
        auth_router = AuthRouter()
        return auth_router.authenticate(request, lti_authhandler)

class ValidateOneTimeToken(APIView):
    '''Validates the one time token received and returns a long term token'''

    authentication_classes = ()
    permission_classes = ()
    def post(self, request, format=None):
        one_time_token = request.data['token']
        
        # Ensure that the token has not expired
        try:
            decrypted_token = jwt.decode(one_time_token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({ "error": "Token expired" }, status=HTTP_401_UNAUTHORIZED)

        # Ensure that the token exists in the one time token document
        # Otherwise it must have already been used, or was never generated (is fake)
        token = OneTimeToken.objects.get(token=one_time_token)
        if token:
            # Delete the one time token so that it cannot be used again
            token.delete()
            user = User.objects.get(id=decrypted_token['id'])
            long_term_token = Token.objects.get_or_create(user=user)
            return Response({ "token": long_term_token })

        return Response({ "error": "Token does not exist" }, status=HTTP_401_UNAUTHORIZED)
