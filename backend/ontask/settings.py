"""
Django settings for ontask project.

Generated by 'django-admin startproject' using Django 1.11.7.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import os
import sys
import mongoengine
from boto3 import Session

# Default settings
EMAIL_NAME = None
EMAIL_ALIAS = None
AWS_PROFILE = None
TEAMS_WEBHOOK = None
DATALAB_DUMP_BUCKET = None
LOG_GROUP = None
EMAIL_BATCH_SIZE = None
EMAIL_BATCH_PAUSE = None

from ontask.env import *

if os.environ.get("ONTASK_DEVELOPMENT"):
    FRONTEND_DOMAIN = (
        "https://localhost:3000"
    )  # For whitelisting CORS and authentication
    BACKEND_DOMAIN = "https://localhost:8000"
    ALLOWED_HOSTS = ["localhost"]

SERVER_EMAIL = EMAIL_HOST_USER

DEBUG = os.environ.get("DJANGO_DEBUG")

# RabbitMQ served via Docker container (docker-compose)
CELERY_BROKER_URL = "amqp://rabbitmq"

# MongoDB served via Docker container (docker-compose)
NOSQL_DATABASE = {"ENGINE": "djongo", "HOST": "db", "NAME": "ontask"}
# For the user model via Djongo
DATABASES = {"default": NOSQL_DATABASE}
# For application data via mongoengine
mongoengine.connect(NOSQL_DATABASE["NAME"], host=NOSQL_DATABASE["HOST"])

LTI_URL = LTI_CONFIG.get("url")
if LTI_URL:
    X_FRAME_OPTIONS = f"ALLOW-FROM {LTI_URL}"

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Application definition

INSTALLED_APPS = [
    "accounts",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_celery_beat",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_mongoengine",
    "scheduler",
    "corsheaders",
    "administration",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

CORS_ORIGIN_WHITELIST = FRONTEND_DOMAIN  # Domain specified in the config file

ROOT_URLCONF = "ontask.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "ontask.wsgi.application"

# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = "en-us"

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.TokenAuthentication",
    ),
    "EXCEPTION_HANDLER": "helpers.exception_handler.JSONExceptionHandler",
}

AUTH_USER_MODEL = "accounts.User"

# Default celery broker
# http://docs.celeryproject.org/en/latest/getting-started/brokers/rabbitmq.html

CELERY_TIMEZONE = "UTC"
CELERY_ENABLE_UTC = True
TIME_ZONE = "UTC"

# Workaround for "BrokenPipeError: [Errno 32] Broken pipe" issue with Celery
# Refer to https://github.com/celery/celery/issues/4226
BROKER_POOL_LIMIT = None

DB_DRIVER_MAPPING = {"postgresql": "postgresql", "mysql": "mysql+pymysql"}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(levelname)s %(asctime)s (%(name)s) %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {"()": "json_log_formatter.JSONFormatter"},
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "standard",
        },
        "json_console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "json",
        },
    },
    "loggers": {
        "django": {"level": "INFO", "handlers": ["console"], "propagate": False},
        "ontask": {"level": "INFO", "handlers": ["json_console"], "propagate": False},
        "emails": {"level": "INFO", "handlers": ["json_console"], "propagate": False},
    },
}

if TEAMS_WEBHOOK:
    LOGGING["handlers"]["teams"] = {
        "level": "WARNING",
        "class": "helpers.teams_logger.TeamsExceptionHandler",
    }
    LOGGING["loggers"]["django"]["handlers"].append("teams")


if ENABLE_CLOUDWATCH_LOGGING and LOG_GROUP:
    session = {"region_name": AWS_REGION}
    if AWS_PROFILE:
        session["profile_name"] = AWS_PROFILE

    watchtower = {
        "level": "INFO",
        "class": "watchtower.django.CloudWatchLogHandler",
        "boto3_session": Session(**session),
        "log_group": LOG_GROUP,
    }

    LOGGING["handlers"]["watchtower"] = {
        **watchtower,
        "formatter": "standard",
        "stream_name": os.environ.get("LOG_STREAM"),
    }
    LOGGING["loggers"]["django"]["handlers"].append("watchtower")

    LOGGING["handlers"]["audit"] = {
        **watchtower,
        "formatter": "json",
        "stream_name": "Audit",
    }
    LOGGING["loggers"]["ontask"]["handlers"].append("audit")

    LOGGING["handlers"]["emails"] = {
        **watchtower,
        "formatter": "json",
        "stream_name": "Emails",
    }
    LOGGING["loggers"]["emails"]["handlers"].append("emails")
