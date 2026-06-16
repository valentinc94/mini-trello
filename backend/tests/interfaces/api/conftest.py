"""
Shared test fixtures for the API interface tests.

Provides authenticated and unauthenticated API clients, plus common
model fixtures built via factory_boy to keep individual test files clean.
"""

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from backend.apps.projects.models import Project, Task
from backend.tests.interfaces.api import factories


@pytest.fixture
def api_client() -> APIClient:
    """Unauthenticated API client."""
    return APIClient()


@pytest.fixture
def user(db):
    """A standard authenticated user."""
    return factories.User()


@pytest.fixture
def other_user(db):
    """A second user — used to test cross-user permission boundaries."""
    return factories.User()


@pytest.fixture
def auth_client(user) -> APIClient:
    """
    API client authenticated as 'user' via an access_token cookie.

    Mirrors the real cookie-based JWT flow used by the frontend.
    """
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.cookies["access_token"] = str(refresh.access_token)
    return client


@pytest.fixture
def other_auth_client(other_user) -> APIClient:
    """API client authenticated as 'other_user'."""
    client = APIClient()
    refresh = RefreshToken.for_user(other_user)
    client.cookies["access_token"] = str(refresh.access_token)
    return client


@pytest.fixture
def project(db, user) -> Project:
    """A project owned by 'user'."""
    return factories.Project(owner=user)


@pytest.fixture
def task(db, project) -> Task:
    """A task inside 'project' with default priority and status."""
    return factories.Task(project=project)
