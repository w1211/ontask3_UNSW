from django.conf.urls import url

from . import views

app_name = 'ontask'

urlpatterns = [
    url(r'^schedule_email', views.ScheduleEmailTaskView.as_view())
    url(r'^datasource', views.DataSourceUpdateTaskView.as_view())
]
