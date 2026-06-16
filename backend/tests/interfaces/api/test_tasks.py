"""
Tests for the Tasks API interface.

Covers: CRUD operations, filter parameters (status, priority, assigned_to),
ownership rules (only project owner can delete tasks), and permission
boundaries between users.
"""

import pytest
from rest_framework.test import APIClient

from backend.apps.projects import constants
from backend.apps.projects.models import Task
from backend.tests.interfaces.api import factories


@pytest.mark.django_db
class TestCreateTask:
    def url(self, project_id: int) -> str:
        return f"/api/v1/projects/{project_id}/tasks/"

    def test_success_returns_201_with_defaults(self, auth_client: APIClient, project):
        response = auth_client.post(
            self.url(project.id), {"title": "Implement login", "priority": "high"}
        )

        assert response.status_code == 201
        assert response.data["title"] == "Implement login"
        assert response.data["priority"] == "high"
        assert response.data["status"] == constants.TaskStatus.TO_DO

    def test_default_priority_is_medium(self, auth_client: APIClient, project):
        response = auth_client.post(self.url(project.id), {"title": "No priority set"})

        assert response.status_code == 201
        assert response.data["priority"] == constants.TaskPriority.MEDIUM

    def test_with_assigned_user_embeds_user(
        self, auth_client: APIClient, project, other_user
    ):
        response = auth_client.post(
            self.url(project.id),
            {"title": "Assigned task", "assigned_to_id": other_user.id},
        )

        assert response.status_code == 201
        assert response.data["assigned_to"]["id"] == other_user.id

    def test_duplicate_title_in_same_project_returns_409(
        self, auth_client: APIClient, project, task
    ):
        response = auth_client.post(self.url(project.id), {"title": task.title})

        assert response.status_code == 409

    def test_in_other_users_project_returns_404(
        self, other_auth_client: APIClient, project
    ):
        """Users cannot create tasks in projects they don't own."""
        response = other_auth_client.post(self.url(project.id), {"title": "Intruder"})

        assert response.status_code == 404

    @pytest.mark.parametrize(
        "payload",
        [
            {"priority": "low"},
            {},
        ],
    )
    def test_missing_title_returns_400(
        self, auth_client: APIClient, project, payload: dict
    ):
        response = auth_client.post(self.url(project.id), payload)

        assert response.status_code == 400


@pytest.mark.django_db
class TestListTasks:
    def url(self, project_id: int) -> str:
        return f"/api/v1/projects/{project_id}/tasks/"

    def test_returns_all_project_tasks(self, auth_client: APIClient, project, task):
        factories.Task(project=project)

        response = auth_client.get(self.url(project.id))

        assert response.status_code == 200
        assert response.data["count"] == 2

    @pytest.mark.parametrize(
        "filter_key,filter_value,matching_title",
        [
            ("status", "to_do", "Todo task"),
            ("priority", "urgent", "Urgent task"),
        ],
    )
    def test_filters_return_only_matching_tasks(
        self,
        auth_client: APIClient,
        project,
        filter_key: str,
        filter_value: str,
        matching_title: str,
    ):
        if filter_key == "status":
            factories.Task(
                title=matching_title, project=project, status=constants.TaskStatus.TO_DO
            )
            factories.Task(
                title="Done task", project=project, status=constants.TaskStatus.DONE
            )
        else:
            factories.Task(
                title=matching_title,
                project=project,
                priority=constants.TaskPriority.URGENT,
            )
            factories.Task(
                title="Low task", project=project, priority=constants.TaskPriority.LOW
            )

        response = auth_client.get(self.url(project.id), {filter_key: filter_value})

        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == matching_title

    def test_filter_by_assigned_to(self, auth_client: APIClient, project, other_user):
        factories.Task(title="Assigned", project=project, assigned_to=other_user)
        factories.Task(title="Unassigned", project=project)

        response = auth_client.get(self.url(project.id), {"assigned_to": other_user.id})

        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == "Assigned"

    def test_other_users_project_returns_404(
        self, other_auth_client: APIClient, project
    ):
        response = other_auth_client.get(self.url(project.id))

        assert response.status_code == 404


@pytest.mark.django_db
class TestRetrieveTask:
    def test_as_project_owner_returns_200(self, auth_client: APIClient, task):
        response = auth_client.get(f"/api/v1/tasks/{task.id}/")

        assert response.status_code == 200
        assert response.data["id"] == task.id

    def test_as_assigned_user_returns_200(
        self, other_auth_client: APIClient, project, other_user
    ):
        """Assigned users can retrieve tasks even if they don't own the project."""
        task = factories.Task(project=project, assigned_to=other_user)

        response = other_auth_client.get(f"/api/v1/tasks/{task.id}/")

        assert response.status_code == 200

    def test_with_no_access_returns_404(self, other_auth_client: APIClient, task):
        """A user with no relation to the task sees 404, not 403."""
        response = other_auth_client.get(f"/api/v1/tasks/{task.id}/")

        assert response.status_code == 404


@pytest.mark.django_db
class TestUpdateTask:
    @pytest.mark.parametrize(
        "field,value",
        [
            ("status", "in_progress"),
            ("title", "Renamed Task"),
            ("priority", "urgent"),
        ],
    )
    def test_patch_single_field_returns_200(
        self, auth_client: APIClient, task, field: str, value: str
    ):
        response = auth_client.patch(f"/api/v1/tasks/{task.id}/", {field: value})

        assert response.status_code == 200
        assert response.data[field] == value

    def test_patch_persists_status_to_db(self, auth_client: APIClient, task):
        auth_client.patch(f"/api/v1/tasks/{task.id}/", {"status": "done"})

        task.refresh_from_db()
        assert task.status == constants.TaskStatus.DONE

    def test_patch_invalid_status_returns_400(self, auth_client: APIClient, task):
        response = auth_client.patch(
            f"/api/v1/tasks/{task.id}/", {"status": "not_valid"}
        )

        assert response.status_code == 400

    def test_patch_duplicate_title_returns_409(
        self, auth_client: APIClient, project, task
    ):
        other = factories.Task(title="Existing Title", project=project)

        response = auth_client.patch(
            f"/api/v1/tasks/{task.id}/", {"title": other.title}
        )

        assert response.status_code == 409


@pytest.mark.django_db
class TestDeleteTask:
    def test_as_project_owner_returns_204(self, auth_client: APIClient, task):
        response = auth_client.delete(f"/api/v1/tasks/{task.id}/")

        assert response.status_code == 204
        assert not Task.objects.filter(pk=task.id).exists()

    def test_as_assigned_user_returns_403(
        self, other_auth_client: APIClient, project, other_user
    ):
        """Only the project owner can delete tasks — even assigned users cannot."""
        task = factories.Task(project=project, assigned_to=other_user)

        response = other_auth_client.delete(f"/api/v1/tasks/{task.id}/")

        assert response.status_code == 403
        assert Task.objects.filter(pk=task.id).exists()

    def test_nonexistent_task_returns_404(self, auth_client: APIClient):
        response = auth_client.delete("/api/v1/tasks/99999/")

        assert response.status_code == 404
