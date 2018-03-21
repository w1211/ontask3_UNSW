''' AUTHENTICATION WRAPPER '''
from django.conf import settings
from jwt import decode, ExpiredSignature
from Crypto.Cipher import XOR
import base64
import traceback
from .auth_handler import UserAuthHandler

class LocalAuthHandler(UserAuthHandler):
    '''Login methods for local authentication'''
    def authenticate_user(self, payload):
        '''Verifies if LTI has authenticated the user and returns a User object'''
        try:
            email = payload['email']
            password = payload['password']
            user = self.authenticate(email, password)
            return user
        except Exception as ex:
            return None

class LTIAuthHandler(UserAuthHandler):
    '''Login methods for LTI authentication'''
    def __init__(self):
        '''Initializes the configurations for the AAF authentication'''
        # Maps the AAF configuration from the settings file
        self.config = settings.LTI_CONFIG
        self.cipher = XOR.new(settings.CIPHER_SUITE_KEY)

    def authenticate_user(self, payload):
        '''Verifies if LTI has authenticated the user and returns a User object'''
        try:
            email = payload["lis_person_contact_email_primary"][0]
            fullname = payload["lis_person_name_full"][0]
            password = base64.b64encode(self.cipher.encrypt(email))
            role = self.extract_user_role(payload["roles"][0])
            user = self.authenticateOrCreate(email, fullname, password, role)
            #zid for checking if user is workflow owner
            zid = payload["ext_user_username"][0]
            #create unique link_id for this link, will use this id to map with workflow
            context_id = payload["context_id"][0]
            resource_link_id = payload["resource_link_id"][0]
            link_id = context_id + '.' + resource_link_id
            return user, zid, link_id
        except Exception as ex:
            return None
    
    def extract_user_role(self, user_role_mapping):
        '''Retrieves the correct role mapping to set the
        permissions against user authenticated against AAF'''

        role_domain = user_role_mapping.split(";")

        # Check for a Staff role
        for role in role_domain:
            if role in self.config['role_mappings']['staff']:
                return 'STAFF'
        return 'STUDENT'

class AAFAuthHandler(UserAuthHandler):
    '''Login methods for AAF Rapid connect'''
    def __init__(self):
        '''Initializes the configurations for the AAF authentication'''
        # Maps the AAF configuration from the settings file
        self.config = settings.AAF_CONFIG
        self.cipher = XOR.new(settings.CIPHER_SUITE_KEY)

    def authenticate_user(self, jwt_payload):
        '''Verifies if AAF has authenticated the user and returns a User object'''
        try:
            # Verifies signature and expiry time
            # TODO remap the input variable to the value
            # passed from AAF [self.request.POST['assertion']]
            verified_jwt = decode(jwt_payload['assertion'], self.config['secret_key'], audience=self.config['aaf.edu.au']['aud'])
            
            # TODO  - Check: In a complete app we'd also store and
            # validate the jti value to ensure there is no replay attack
            if verified_jwt['aud'] == self.config['aaf.edu.au']['aud'] \
            and verified_jwt['iss'] == self.config['aaf.edu.au']['iss']:
                user_attributes = verified_jwt['https://aaf.edu.au/attributes']
                email = user_attributes["mail"]
                fullname =  user_attributes["displayname"]
                password = base64.b64encode(self.cipher.encrypt(email))
                role = self.extract_user_role(user_attributes["edupersonscopedaffiliation"])
                user = self.authenticateOrCreate(email, fullname, password, role)
                return user
            else:
                #self.status = 403
                #TODO logging
                #self.response.write('Error: Not for this audience')
                print("############ 403 Not Authorized ##############")
                return "NOT_AUTHORIZED"
        except ExpiredSignature:
            #self.status = 403
            #TODO logging
            #self.response.write('Error: Security cookie has expired')
            print("############ 403 ExpiredSignature ##############")
            return "EXPIRED_SIGNATURE"
        except Exception:
            print("################### GENERIC EXCEPTION ##################")
            # TODO loggin
            print(traceback.print_exc())
            print("################### GENERIC EXCEPTION ##################")
        return None
            
    def extract_user_role(self, user_role_mapping):
        '''Retrieves the correct role mapping to set the
        permissions against user authenticated against AAF'''

        role_domain = user_role_mapping.split(";")

        # Check for a Staff role
        for role in role_domain:
            if role in self.config['role_mappings']['staff']:
                return 'STAFF'
        return 'STUDENT'
