"""
Validation logic for the projects domain.

This module contains functions to validate business rules,
data integrity, and existence checks for Project and Task entities
before interacting with the core database operations.
"""

from backend.apps.projects import models


def project_exists(name: str) -> bool:
    """
    Check if a project with the given name already exists in the database.

    Args:
        name: The exact name of the project to look up.

    Returns:
        bool: True if a project with that name exists, False otherwise.
    """
    return models.Project.objects.filter(name=name).exists()


def task_exists(project_id: int, title: str) -> bool:
    """
    Check whether a task with a given title already exists within a specific project.

    This function queries the database to determine if there is at least one
    Task record associated with the provided project ID that matches the given title.

    Args:
        project_id (int): Identifier of the project where the task is being checked.
        title (str): Exact title of the task to search for.

    Returns:
        bool: True if a matching task exists in the project, otherwise False.
    """
    return models.Task.objects.filter(project_id=project_id, title=title).exists()
