''' VIEWS FOR USER AUTHENTICATION '''
from __future__ import unicode_literals
from rest_framework.views import APIView
from .auth_wrapper import AAFAuthHandler, LTIAuthHandler
from .auth_router import AuthRouter
from rest_framework.response import Response


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

class RetrieveUser(APIView):
    '''Retrieves the user ID of a user logged in'''
    authentication_classes = ()
    permission_classes = ()
    def get(self, request, format=None):
        response =  Response({"error":"User not logged in"})
        try:
            if request.session['_auth_user_id']:
                response =  Response({"user_id":request.session['_auth_user_id'],"token":request.session['token']})
            else:
                response =  Response({"error":"User not logged in"})
            return response
        except Exception as exception:
            print(exception)
            return Response({"error":"User not logged in"})


        

