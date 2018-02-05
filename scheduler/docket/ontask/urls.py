from django.conf.urls import url

from . import views

app_name = 'ontask'

urlpatterns = [
    url(r'^datasource', views.CreateDataSourceUpdateTaskView.as_view())
]