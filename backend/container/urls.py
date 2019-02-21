from django.urls import path
from .views import *

urlpatterns = [
    path("", CreateContainer),
    path("<id>/", DetailContainer.as_view()),
    path("<id>/surrender_access/", SurrenderAccess),
]
