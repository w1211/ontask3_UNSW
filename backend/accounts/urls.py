from django.conf.urls import url

from . import views

urlpatterns = [
    url("local/", views.LocalAuth.as_view()),
    url("aaf/", views.AAFAuth.as_view()),
    url("lti/", views.LTIAuth.as_view(), name="lti"),
    url("token/", views.ValidateOneTimeToken.as_view())
]
