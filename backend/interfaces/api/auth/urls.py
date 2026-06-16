"""
Authentication API URL configuration.

This module defines the JWT authentication endpoints used by the system.
All token operations read/write from HTTP-only cookies — never the request body.

Endpoints:
    POST /api/v1/auth/register/
        Register a new user account.

    POST /api/v1/auth/login/
        Authenticate with username + password and receive JWT cookies.

    POST /api/v1/auth/logout/
        Clear JWT cookies and blacklist the refresh token.

    POST /api/v1/auth/token/refresh/
        Issue a new access token from the refresh token cookie.

    GET /api/v1/auth/me/
        Return the current authenticated user's profile.
"""

from django.urls import path

from backend.interfaces.api.auth import views

app_name = "auth_api"

urlpatterns = [
    path(
        "api/v1/auth/register/",
        views.RegisterView.as_view(),
        name="register",
    ),
    path(
        "api/v1/auth/login/",
        views.LoginView.as_view(),
        name="login",
    ),
    path(
        "api/v1/auth/logout/",
        views.LogoutView.as_view(),
        name="logout",
    ),
    path(
        "api/v1/auth/token/refresh/",
        views.TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "api/v1/auth/me/",
        views.MeView.as_view(),
        name="me",
    ),
]
