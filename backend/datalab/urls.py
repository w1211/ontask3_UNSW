from django.urls import path
from .views import *

urlpatterns = [
    path("<id>/access/", AccessDataLab),
    path("<id>/csv/", ExportToCSV),
]
