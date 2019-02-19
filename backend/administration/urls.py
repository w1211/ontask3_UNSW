from django.urls import path
from .views import *


urlpatterns = [
     path("users/<int:pk>/new-group/", change_group),
     path("users/", UsersList.as_view()),
     path("user-search/", search_users)
]