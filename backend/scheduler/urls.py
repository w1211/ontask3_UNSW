from django.conf.urls import url

from . import views

app_name = 'scheduler'

urlpatterns = [
    url(r'^datasource', views.DataSourceUpdateTaskView.as_view()),
    url(r'^send_email', views.SendEmailTaskView.as_view()),
    url(r'^workflow', views.WorkflowTaskView.as_view())
]