""" GENERIC USER AUTHENTICATION"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()


class UserAuthHandler(object):
    def create(email, password, fullname):
        """Creates a new user for local authentication"""
        # Create a new user based on the AAF login infromation
        user = User.objects.create_user(
            email=email, password=password, name=fullname
        )
        user.save()
        return user

    def authenticate(self, email, password):
        """Authenticates the user logging in locally, 
        but does not create a new user if they do not exist"""
        # retrieve the existing user information
        user = authenticate(username=email, password=password)
        if user == None:
            raise ValueError("User does not exist")
        return user

    def authenticateOrCreate(self, email, fullname, password, role):
        """Authenticates and creates a record for a user logging in from an external 
        Identity Provider"""
        try:
            # retrieve the existing user information
            user = authenticate(username=email, password=password)
            if user == None:
                raise ValueError("User Does not exist")
        except (ValueError, User.DoesNotExist):
            # Create a new user based on the AAF login infromation
            user = User.objects.create_user(
                email=email, password=password, name=fullname
            )
            # Set the parameters for the new user and save the new user
            user.is_superuser = False

            # Enables permissions based on a user role
            if role == "STAFF":
                user.is_staff = True
                # TODO: Troubleshoot why the below two lines cause an error
                # instructor_group = Group.objects.get(name='instructor')
                # instructor_group.user_set.add(user)

            user.save()

        return user

