"""
Authentication views for the users app.

This module handles all JWT authentication flows: registration, login,
logout, token refresh and current-user retrieval.

All JWT tokens are stored in HTTP-only cookies for secure frontend usage,
never exposed in the response body.
"""

import logging

from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from backend.domains.users import exceptions, processes
from backend.interfaces.api.auth import serializers

logger = logging.getLogger(__name__)


def _set_auth_cookies(response: Response, refresh: RefreshToken) -> None:
    """
    Attach JWT access and refresh tokens as HTTP-only cookies to the response.

    Args:
        response: The DRF Response object to attach cookies to.
        refresh: A SimpleJWT RefreshToken instance.
    """
    response.set_cookie(
        key="access_token",
        value=str(refresh.access_token),
        httponly=True,
        secure=True,
        samesite="Lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=True,
        samesite="Lax",
    )


def _clear_auth_cookies(response: Response) -> None:
    """
    Delete JWT cookies from the client by setting them to expired values.

    Args:
        response: The DRF Response object to clear cookies on.
    """
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")


class RegisterView(APIView):
    """
    Handles new user registration.

    Accepts username and password, delegates creation to the users domain,
    and returns JWT tokens in HTTP-only cookies on success.

    Attributes:
        authentication_classes (list): Disabled — public endpoint.
        permission_classes (list): Disabled — public endpoint.

    Methods:
        post(request): Registers a new user and issues JWT cookies.
    """

    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=serializers.RegisterSerializer,
        responses={201: serializers.AuthResponseSerializer},
        summary="Register a new user",
        tags=["Authentication"],
    )
    def post(self, request):
        """
        Register a new user and issue JWT tokens in HTTP-only cookies.

        Args:
            request: HTTP request containing 'username' and 'password'.
                     Optional: 'email', 'first_name', 'last_name'.

        Returns:
            Response: 201 with user info and JWT cookies set.

        Raises:
            400 Bad Request: If required fields are missing.
            409 Conflict: If the username is already taken.
        """
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = processes.register_user(
                username=username,
                password=password,
                email=request.data.get("email", ""),
                first_name=request.data.get("first_name", ""),
                last_name=request.data.get("last_name", ""),
            )
        except exceptions.UsernameAlreadyExists:
            return Response(
                {"detail": f"Username '{username}' is already taken."},
                status=status.HTTP_409_CONFLICT,
            )

        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "user_id": user.id,
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )

        _set_auth_cookies(response, refresh)

        return response


class LoginView(APIView):
    """
    Handles user authentication and JWT token issuance.

    This view authenticates a user using username and password.
    If credentials are valid, it generates JWT access and refresh tokens
    and stores them in HTTP-only cookies to ensure secure client-side handling.

    Attributes:
        authentication_classes (list): Disabled — public endpoint.
        permission_classes (list): Disabled — public endpoint.

    Methods:
        post(request): Authenticates user and returns JWT cookies.
    """

    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=serializers.LoginSerializer,
        responses={200: serializers.AuthResponseSerializer},
        summary="Log in and receive JWT cookies",
        tags=["Authentication"],
    )
    def post(self, request):
        """
        Authenticate user and issue JWT tokens in HTTP-only cookies.

        Args:
            request: HTTP request containing 'username' and 'password'.

        Returns:
            Response: 200 with user info and JWT cookies set.

        Raises:
            401 Unauthorized: If credentials are invalid.
        """
        user = authenticate(
            username=request.data.get("username", "").lower(),
            password=request.data.get("password"),
        )

        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "user_id": user.id,
                "username": user.username,
            }
        )

        _set_auth_cookies(response, refresh)

        return response


class LogoutView(APIView):
    """
    Handles user logout by clearing JWT cookies and blacklisting the refresh token.

    This endpoint is intentionally public: if the access token has already expired,
    the client can no longer authenticate but must still be able to clear cookies
    and blacklist the refresh token.

    Methods:
        post(request): Clears JWT cookies and blacklists the refresh token.
    """

    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=None,
        responses={204: None},
        summary="Log out and clear JWT cookies",
        tags=["Authentication"],
    )
    def post(self, request):
        """
        Log out the current user.

        Reads the 'refresh_token' cookie, blacklists it (if SimpleJWT blacklist
        app is enabled), and clears both auth cookies from the response.

        Args:
            request: Authenticated HTTP request.

        Returns:
            Response: 204 No Content on success.
        """
        refresh_token = request.COOKIES.get("refresh_token")

        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_auth_cookies(response)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                if hasattr(token, "blacklist"):
                    token.blacklist()
            except TokenError as exc:
                # The token may already be expired or blacklisting is not enabled.
                # We log the event rather than silently swallowing it so that
                # unexpected token errors remain visible in production logs.
                logger.warning(
                    "Logout: could not blacklist refresh token — %s",
                    exc,
                )
            except AttributeError as exc:
                # SimpleJWT token_blacklist app is likely not installed
                logger.info("Logout: token blacklisting is not enabled on this server.")

        return response


class TokenRefreshView(APIView):
    """
    Refreshes the JWT access token using the refresh token stored in cookies.

    Unlike the default SimpleJWT view that reads from the request body,
    this view reads the refresh token from the HTTP-only cookie, issues a new
    access token, and sets it back as a cookie.

    Attributes:
        authentication_classes (list): Disabled — uses cookie-based token.
        permission_classes (list): Disabled — public endpoint for token renewal.

    Methods:
        post(request): Rotates access token using the cookie refresh token.
    """

    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=None,
        responses={200: None},
        summary="Refresh access token from cookie",
        tags=["Authentication"],
    )
    def post(self, request):
        """
        Issue a new access token from the cookie-based refresh token.

        Args:
            request: HTTP request with a valid 'refresh_token' cookie.

        Returns:
            Response: 200 with new access token cookie set.

        Raises:
            401 Unauthorized: If the refresh token is missing or invalid.
        """
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({"detail": "Token refreshed."})

        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            secure=True,
            samesite="Lax",
        )

        return response


class MeView(APIView):
    """
    Returns the currently authenticated user's basic profile information.

    This endpoint is protected and requires a valid JWT access token
    stored in the 'access_token' HTTP-only cookie.

    Methods:
        get(request): Returns the authenticated user's data.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: serializers.MeResponseSerializer},
        summary="Get current user profile",
        tags=["Authentication"],
    )
    def get(self, request):
        """
        Retrieve the current authenticated user's profile.

        Args:
            request: Authenticated HTTP request.

        Returns:
            Response: 200 with the user's id, username, email and name.
        """
        user = request.user

        return Response(
            {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        )
