"""
Custom JWT authentication backend.

This module provides a JWTCookieAuthentication class that reads the
JWT access token from the 'access_token' HTTP-only cookie instead of
the standard 'Authorization' header. This is required because the
challenge mandates storing tokens in cookies, not localStorage.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTCookieAuthentication(JWTAuthentication):
    """
    Extends SimpleJWT's default authentication to read tokens from cookies.

    Django REST Framework's standard flow expects the token in the
    'Authorization: Bearer <token>' header. This subclass overrides
    authenticate() to pull the token directly from the 'access_token'
    HTTP-only cookie, keeping the rest of the validation pipeline intact.
    """

    def authenticate(self, request):
        """
        Attempt to authenticate the request using the 'access_token' cookie.

        Args:
            request: The incoming HTTP request.

        Returns:
            tuple: (user, token) if authentication succeeds, None otherwise.
        """
        access_token = request.COOKIES.get("access_token")

        if not access_token:
            return None

        validated_token = self.get_validated_token(access_token)

        return self.get_user(validated_token), validated_token


class JWTCookieAuthenticationScheme(OpenApiAuthenticationExtension):
    """
    Tells drf-spectacular how to document our custom cookie authenticator
    in the generated OpenAPI schema.
    """

    target_class = (
        "backend.interfaces.api.commons.authenticator.JWTCookieAuthentication"
    )
    name = "cookieAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": "access_token",
            "description": "JWT access token stored in HTTP-only cookie.",
        }
