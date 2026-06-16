"""
Projects domain queries.

This module contains read-only query helpers for the Projects domain.
It centralizes database access logic related to projects and tasks,
ensuring a clean separation between business logic and ORM queries.

These functions are designed to be reused across services, views,
and other application layers.
"""

from django.contrib.auth import models as users_models
from django.db.models import Q
from django.db.models.query import QuerySet

from backend.apps.projects import models


def get_accessible_projects_for_user(
    user: users_models.User,
) -> QuerySet[models.Project]:
    """
    Return projects where the user has access.

    Currently includes:
    - Projects owned by the user
    - Projects where the user is assigned to at least one task
    """
    return models.Project.objects.filter(
        Q(owner=user) | Q(tasks__assigned_to=user)
    ).distinct()


def get_tasks_for_project(
    project: models.Project,
    status: str | None = None,
    priority: str | None = None,
    assigned_to_id: int | None = None,
) -> QuerySet[models.Task]:
    """
    Return tasks belonging to a project, with optional filters.

    Args:
        project: The project instance to retrieve tasks for.
        status: Optional filter by task status (e.g. 'to_do', 'in_progress', 'done').
        priority: Optional filter by task priority (e.g. 'low', 'medium', 'high', 'urgent').
        assigned_to_id: Optional filter by the assigned user's ID.

    Returns:
        QuerySet[Task]: A filtered queryset of tasks, ordered by creation date descending.
    """
    queryset = models.Task.objects.filter(project=project).select_related("assigned_to")

    if status:
        queryset = queryset.filter(status=status)

    if priority:
        queryset = queryset.filter(priority=priority)

    if assigned_to_id:
        queryset = queryset.filter(assigned_to_id=assigned_to_id)

    return queryset
