import os
from celery import Celery

# Set the default Django settings module for celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ontask.settings')

app = Celery('ontask')

# Namespace='CELERY' means that all celery-related configuration keys
# should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()
