# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^user/auth', views.AAFAuthRouter.as_view()),
    url(r'^user/lti', views.LTIAuthRouter.as_view()),
    url(r'^user/token', views.ValidateOneTimeToken.as_view())
]
