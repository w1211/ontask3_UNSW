''' GENERIC USER AUTHENTICATION'''
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAuthHandler(object):
    '''Authenticates and creates a record for a user logging in form an external 
    Identity Provider'''

    def authenticate(self, email, fullname, password, role):
        '''Authenticates an external user into the system'''
        try:
            # retrieve the existing user information
	    print "############# USERNAME ################"
	    print email
	    print "############# USERNAME ################"
	    print "############# PASSWORD ################"
	    print password
	    print "############# PASSWORD ################"
            user = authenticate(username=email, password=password)
            if user == None:
                raise ValueError('User Does not exist')
        except (ValueError, User.DoesNotExist):
            # Create a new user based on the AAF login infromation
            user = User.objects.create_user(email=email, password=password,name=fullname)
            # Set the parameters for the new user and save the new user
            user.is_superuser = False
            
            # Enables permissions based on a user role
            if role == 'STAFF':
                instructor_group = Group.objects.get(name='instructor')
                instructor_group.user_set.add(user)
                user.is_staff = True
            
            user.save()
                
        return user

