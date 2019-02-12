from django.urls import path
from .views import *

urlpatterns = [
    path("", ListContainers.as_view()),
    path("<id>/", DetailContainer.as_view()),
    path("<id>/surrender_access/", surrender_access),
]
