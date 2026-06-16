"""
Tests for the Projects API interface.

Covers: CRUD operations, ownership enforcement (a user cannot see another
user's projects), pagination, and proper HTTP status codes.
"""

import pytest
from rest_framework.test import APIClient

from backend.apps.projects.models import Project
from backend.tests.interfaces.api import factories


@pytest.mark.django_db
class TestCreateProject:
    URL = "/api/v1/projects/"

    def test_success_returns_201(self, auth_client: APIClient, user):
        response = auth_client.post(
            self.URL, {"name": "Alpha Project", "description": "First project"}
        )

        assert response.status_code == 201
        assert response.data["name"] == "Alpha Project"
        assert response.data["owner"]["id"] == user.id

    def test_owner_is_injected_from_request(self, auth_client: APIClient):
        other = factories.User()
        response = auth_client.post(
            self.URL,
            {"name": "Spoofed Project", "description": "X", "owner": other.id},
        )

        assert response.status_code == 201
        assert response.data["owner"]["username"] != other.username

    def test_duplicate_name_returns_409(self, auth_client: APIClient, project: Project):
        response = auth_client.post(
            self.URL, {"name": project.name, "description": "Duplicate"}
        )

        assert response.status_code == 409

    @pytest.mark.parametrize(
        "payload,expected_status",
        [
            ({"description": "No name"}, 400),
            ({}, 400),
        ],
    )
    def test_invalid_payload_returns_expected_status(
        self, auth_client: APIClient, payload: dict, expected_status: int
    ):
        response = auth_client.post(self.URL, payload)

        assert response.status_code == expected_status

    def test_unauthenticated_returns_401(self, api_client: APIClient):
        response = api_client.post(self.URL, {"name": "X", "description": "Y"})

        assert response.status_code == 401


@pytest.mark.django_db
class TestListProjects:
    URL = "/api/v1/projects/"

    def test_returns_only_owned_projects(
        self, auth_client: APIClient, user, project: Project
    ):
        other = factories.User()
        factories.Project(owner=other, name="Other Project")

        response = auth_client.get(self.URL)

        assert response.status_code == 200
        returned_names = [p["name"] for p in response.data["results"]]
        assert project.name in returned_names
        assert "Other Project" not in returned_names

    def test_response_is_paginated(self, auth_client: APIClient, user):
        factories.Project.create_batch(3, owner=user)

        response = auth_client.get(self.URL)

        assert response.status_code == 200
        assert "count" in response.data
        assert "results" in response.data

    def test_unauthenticated_returns_401(self, api_client: APIClient):
        response = api_client.get(self.URL)

        assert response.status_code == 401


@pytest.mark.django_db
class TestRetrieveProject:
    def test_own_project_returns_200(self, auth_client: APIClient, project: Project):
        response = auth_client.get(f"/api/v1/projects/{project.id}/")

        assert response.status_code == 200
        assert response.data["id"] == project.id

    def test_other_users_project_returns_404(
        self, other_auth_client: APIClient, project: Project
    ):
        """Must return 404, not 403 — we never confirm existence to unauthorized users."""
        response = other_auth_client.get(f"/api/v1/projects/{project.id}/")

        assert response.status_code == 404

    def test_nonexistent_project_returns_404(self, auth_client: APIClient):
        response = auth_client.get("/api/v1/projects/99999/")

        assert response.status_code == 404


@pytest.mark.django_db
class TestUpdateProject:
    def test_patch_name_returns_200_with_updated_data(
        self, auth_client: APIClient, project: Project
    ):
        response = auth_client.patch(
            f"/api/v1/projects/{project.id}/", {"name": "Updated Name"}
        )

        assert response.status_code == 200
        assert response.data["name"] == "Updated Name"

    def test_patch_duplicate_name_returns_409(
        self, auth_client: APIClient, user, project: Project
    ):
        other = factories.Project(owner=user, name="Taken Name")

        response = auth_client.patch(
            f"/api/v1/projects/{project.id}/", {"name": other.name}
        )

        assert response.status_code == 409

    def test_patch_other_users_project_returns_404(
        self, other_auth_client: APIClient, project: Project
    ):
        response = other_auth_client.patch(
            f"/api/v1/projects/{project.id}/", {"name": "Hijacked"}
        )

        assert response.status_code == 404


@pytest.mark.django_db
class TestDeleteProject:
    def test_own_project_returns_204(self, auth_client: APIClient, project: Project):
        response = auth_client.delete(f"/api/v1/projects/{project.id}/")

        assert response.status_code == 204
        assert not Project.objects.filter(pk=project.id).exists()

    def test_other_users_project_returns_404(
        self, other_auth_client: APIClient, project: Project
    ):
        response = other_auth_client.delete(f"/api/v1/projects/{project.id}/")

        assert response.status_code == 404
        assert Project.objects.filter(pk=project.id).exists()

    def test_nonexistent_project_returns_404(self, auth_client: APIClient):
        response = auth_client.delete("/api/v1/projects/99999/")

        assert response.status_code == 404
