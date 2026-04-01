# config/settings.py

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ─── Base Directory ───────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Security ─────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# ─── Installed Apps ───────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",  # enables logout/blacklisting
    "corsheaders",

    # Local apps
    "apps.users",
    "apps.listings",
    "apps.bookings",
    "apps.payments",
    "apps.audit",
]

# ── Custom User Model
AUTH_USER_MODEL = "users.User"

# ─── Middleware ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # Must be at the top
    'django.middleware.security.SecurityMiddleware',
    "apps.audit.middleware.SecurityHeadersMiddleware", 
    "apps.audit.middleware.RequestLoggingMiddleware", 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
# ── DRF Settings ─────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

# ── JWT Settings ─────────────────────────────────
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":  True,   # issues new refresh token on every refresh
    "BLACKLIST_AFTER_ROTATION": True, # old refresh tokens become invalid
    "AUTH_HEADER_TYPES":      ("Bearer",),
    "USER_ID_FIELD":          "id",
    "USER_ID_CLAIM":          "user_id",
    "AUTH_TOKEN_CLASSES":     ("rest_framework_simplejwt.tokens.AccessToken",),
}

# ── CORS Settings ────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # React Vite dev server
    "http://localhost:3000",   # React CRA dev server (if used)
]

CORS_ALLOW_CREDENTIALS = True

# ── Media Files (profile pictures) ───────────────
import os
MEDIA_URL  = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

ROOT_URLCONF = 'config.urls'

# ─── Templates ────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ─── Database (PostgreSQL) ────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     os.getenv('DB_NAME'),
        'USER':     os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST':     os.getenv('DB_HOST', 'localhost'),
        'PORT':     os.getenv('DB_PORT', '5432'),
    }
}

# ─── Password Validation ──────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Internationalisation ─────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─── Static & Media Files ─────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Django REST Framework ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# ─── SimpleJWT Configuration ──────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# ─── CORS Configuration ───────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",   # React dev server
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# ── Rate Limiting ─────────────────────────────────────────────────
# What this does: Limits how many times per minute someone can
# call your login endpoint. Protects against automated bots
# that try thousands of passwords per second.
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = "default"

# ── Cache (needed for rate limiting) ─────────────────────────────
# What this does: Stores rate limit counters in memory.
# When someone hits the login endpoint, the counter goes up.
# When it hits the limit, they are blocked for a period.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ── Password Validation ───────────────────────────────────────────
# What this does: Forces users to create strong passwords.
# Weak passwords are rejected before they reach the database.
AUTH_PASSWORD_VALIDATORS = [
    {
        # Rejects passwords that are too similar to the username or email
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        # Rejects passwords shorter than 8 characters
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        # Rejects common passwords like "password123"
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        # Rejects passwords that are entirely numbers
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# ── Security Headers ──────────────────────────────────────────────
# What this does: These settings tell Django to add extra
# security instructions to every response it sends.

# Prevents your site from being put inside another site's iframe
# This stops clickjacking attacks where a hacker puts your site
# inside an invisible frame to steal clicks
X_FRAME_OPTIONS = "DENY"

# Stops browsers from guessing the file type of responses
# Prevents MIME sniffing attacks where a browser runs
# a text file as JavaScript
SECURE_CONTENT_TYPE_NOSNIFF = True

# ── Logging ───────────────────────────────────────────────────────
# What this does: Sets up Python logging so that your
# RequestLoggingMiddleware can actually write to the console.
# Every API request will be printed in the terminal.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "apps.audit": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

# ── CORS Tightening ───────────────────────────────────────────────
# What this does: Restricts which websites can talk to your API.
# Only your React frontend is allowed.
# Any other website trying to call your API is blocked.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True

# These are the only HTTP methods allowed from the frontend
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]