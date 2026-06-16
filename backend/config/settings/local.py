import os

from .base import *

# Security
DEBUG = True
ALLOWED_HOSTS = ["*"]

# Database (PostgreSQL via Docker)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "db_backend"),
        "USER": os.environ.get("POSTGRES_USER", "user_backend"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "password_backend"),
        "HOST": os.environ.get("POSTGRES_HOST", "postgres"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}
