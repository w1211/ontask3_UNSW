# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from rest_framework.views import APIView
from django.contrib.auth import login
from rest_framework.response import Response
from rest_framework.status import HTTP_403_FORBIDDEN, HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.authtoken.models import Token
import traceback
from .auth_wrapper import AAFAuthHandler, LTIAuthHandler

from django.shortcuts import render

class AAFAuthRouter(APIView):
    '''Hosts the logic to handle the post request from AAF and authenticate the
    user to the application'''

    authentication_classes = ()
    permission_classes = ()
    def post(self, request, format=None):
        '''Handles the post request from AAF Rapid Connect and routes the user
        to the landing page of the application'''
        try:
            aaf_authhandler = AAFAuthHandler()
            user = aaf_authhandler.authenticate_user(request.data)

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
                return Response({"token": token.key, "name":user.name, "email":user.email})
        except Exception as e:
            # TODO logging
            return Response({"error": "Failure during login process"}, status=HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"error": "Login process encountered an unexpected failure"}, status=HTTP_500_INTERNAL_SERVER_ERROR)

class LTIAuthRouter(APIView):
    '''Hosts the logic to handle the post request from LTI and authenticate the
    user to the application'''

    authentication_classes = ()
    permission_classes = ()
    def post(self, request, format=None):
        '''Handles the post request from LTI and routes the user
        to the landing page of the application'''

        lti_authhandler = LTIAuthHandler()
        user = lti_authhandler.authenticate_user(request.data)

        # Check for a valid login
        if(user):
            login(request, user)

        return Response("")
        

