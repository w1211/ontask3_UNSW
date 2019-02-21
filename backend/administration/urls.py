from django.urls import path
from .views import *


urlpatterns = [
    path("user/<int:pk>/change-group/", ChangeGroup),
    path("user/", ListUsers),
    path("user/search/", SearchUsers),
]
