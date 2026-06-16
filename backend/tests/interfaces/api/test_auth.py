"""
Tests for the authentication API interface.

Covers: registration, login, logout, token refresh and the /me endpoint.
Each test targets a specific HTTP contract (status code + response shape)
or a security/permission boundary.
"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from backend.tests.interfaces.api import factories


@pytest.mark.django_db
class TestRegister:
    URL = "/api/v1/auth/register/"

    def test_success_returns_201_with_user_data(self, api_client: APIClient):
        response = api_client.post(
            self.URL, {"username": "newuser", "password": "strongpass123"}
        )

        assert response.status_code == 201
        assert response.data["username"] == "newuser"
        assert "user_id" in response.data

    def test_stores_username_lowercase(self, api_client: APIClient):
        response = api_client.post(
            self.URL, {"username": "NewUser", "password": "strongpass123"}
        )

        assert response.status_code == 201
        assert response.data["username"] == "newuser"
        assert User.objects.filter(username="newuser").exists()

    def test_sets_httponly_cookies(self, api_client: APIClient):
        response = api_client.post(
            self.URL, {"username": "cookieuser", "password": "strongpass123"}
        )

        assert response.status_code == 201
        assert response.cookies["access_token"]["httponly"]
        assert response.cookies["refresh_token"]["httponly"]

    def test_duplicate_username_returns_409(self, api_client: APIClient):
        user = factories.User()
        response = api_client.post(
            self.URL, {"username": user.username, "password": "strongpass123"}
        )

        assert response.status_code == 409
        assert "detail" in response.data

    @pytest.mark.parametrize(
        "payload",
        [
            {"username": "nopass"},
            {"password": "strongpass123"},
            {},
        ],
    )
    def test_missing_required_fields_returns_400(
        self, api_client: APIClient, payload: dict
    ):
        response = api_client.post(self.URL, payload)

        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    URL = "/api/v1/auth/login/"

    def test_success_returns_200_with_user_data(self, api_client: APIClient):
        user = factories.User()
        response = api_client.post(
            self.URL, {"username": user.username, "password": "strongpass123"}
        )

        assert response.status_code == 200
        assert response.data["username"] == user.username
        assert response.data["user_id"] == user.id

    def test_sets_httponly_cookies(self, api_client: APIClient):
        user = factories.User()
        response = api_client.post(
            self.URL, {"username": user.username, "password": "strongpass123"}
        )

        assert "access_token" in response.cookies
        assert response.cookies["access_token"]["httponly"]

    def test_is_case_insensitive(self, api_client: APIClient):
        """Username lookup must be case-insensitive since storage is lowercased."""
        user = factories.User()
        response = api_client.post(
            self.URL, {"username": user.username.upper(), "password": "strongpass123"}
        )

        assert response.status_code == 200

    @pytest.mark.parametrize(
        "payload,expected_status",
        [
            ({"username": "ghost", "password": "irrelevant"}, 401),
            ({"username": "testuser", "password": "wrongpassword"}, 401),
        ],
    )
    def test_invalid_credentials_returns_401(
        self, api_client: APIClient, payload: dict, expected_status: int
    ):
        factories.User(username="testuser")
        response = api_client.post(self.URL, payload)

        assert response.status_code == expected_status
        assert "detail" in response.data


@pytest.mark.django_db
class TestLogout:
    URL = "/api/v1/auth/logout/"

    def test_returns_204_and_clears_cookies(self, auth_client: APIClient):
        response = auth_client.post(self.URL)

        assert response.status_code == 204
        assert response.cookies["access_token"].value == ""
        assert response.cookies["refresh_token"].value == ""

    def test_without_auth_still_returns_204(self, api_client: APIClient):
        """
        Logout must be idempotent — a client without cookies should not get an error.
        This handles the case where tokens expired before the user clicked logout.
        """
        response = api_client.post(self.URL)

        assert response.status_code == 204


@pytest.mark.django_db
class TestTokenRefresh:
    URL = "/api/v1/auth/token/refresh/"

    def test_with_valid_cookie_returns_new_access_token(self, api_client: APIClient):
        user = factories.User()
        refresh = RefreshToken.for_user(user)
        api_client.cookies["refresh_token"] = str(refresh)

        response = api_client.post(self.URL)

        assert response.status_code == 200
        assert "access_token" in response.cookies

    def test_without_cookie_returns_401(self, api_client: APIClient):
        response = api_client.post(self.URL)

        assert response.status_code == 401


@pytest.mark.django_db
class TestMe:
    URL = "/api/v1/auth/me/"

    def test_returns_current_user_data(self, auth_client: APIClient, user):
        response = auth_client.get(self.URL)

        assert response.status_code == 200
        assert response.data["username"] == user.username
        assert response.data["email"] == user.email
        assert "user_id" in response.data

    def test_without_auth_returns_401(self, api_client: APIClient):
        response = api_client.get(self.URL)

        assert response.status_code == 401
