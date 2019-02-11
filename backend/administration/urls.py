from django.urls import path
from .views import *


urlpatterns = [
     path("user/<int:pk>/new-group/", create_admin),
]