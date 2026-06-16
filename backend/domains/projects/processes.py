"""
Business processes for the projects domain.

This module defines the high-level workflows and use cases for project management.
It acts as the central orchestrator, coordinating domain validations, database
interactions, and business rules to keep the API layer thin and strictly decoupled.
"""

from datetime import date

from django.contrib.auth import models as users_models

from backend.apps.projects import constants, models
from backend.domains.projects import exceptions, validations


def create_project(name: str, description: str, owner_id: int) -> models.Project:
    """
    Creates a new project after validating business rules.

    Args:
        name: The name of the project.
        description: A short description of the project.
        owner_id: The ID of the user creating the project.

    Raises:
        ProjectNameAlreadyExists: If the project name is already taken.

    Returns:
        Project: The newly created project instance.
    """

    if validations.project_exists(name=name):
        raise exceptions.ProjectNameAlreadyExists(name=name)

    return models.Project.new(
        name=name,
        description=description,
        owner_id=owner_id,
    )


def update_project(
    project: models.Project,
    name: str | None = None,
    description: str | None = None,
) -> models.Project:
    """
    Update an existing Project instance with a new name and description.

    This function ensures that the project name remains unique before applying
    the update. If the provided name differs from the current one and already
    exists in the database, it raises a ProjectNameAlreadyExists exception.

    Args:
        project (models.Project): The project instance to be updated.
        name (str): The new project name.
        description (str): The new project description.

    Returns:
        models.Project: The updated project instance.

    Raises:
        ValueError: If no fields are provided for update.
        ProjectNameAlreadyExists: If the new name is already taken by another project.
    """

    if all(value is None for value in (name, description)):
        raise ValueError("At least one field must be provided to update the project.")

    if name and project.name != name and validations.project_exists(name=name):
        raise exceptions.ProjectNameAlreadyExists(name=name)

    project.name = name or project.name
    project.description = description or project.description
    project.save()

    return project


def create_task(
    title: str,
    project_id: int,
    priority: constants.TaskPriority = constants.TaskPriority.MEDIUM,
    description: str = "",
    due_date: date | None = None,
    assigned_to_id: int | None = None,
) -> models.Task:
    """
    Create a new task within a project.

    This function validates that no existing task with the same title already
    exists within the given project before creating a new Task instance.
    If a duplicate title is found, it raises a TaskTitleAlreadyExists exception.

    Args:
        title (str): Title of the task.
        project_id (int): Identifier of the project where the task will be created.
        priority (TaskPriority, optional): Priority level of the task. Defaults to MEDIUM.
        description (str, optional): Detailed description of the task. Defaults to empty string.
        due_date (date | None, optional): Optional deadline for the task.
        assigned_to_id (int | None, optional): ID of the user assigned to the task.

    Returns:
        models.Task: The newly created task instance.

    Raises:
        TaskTitleAlreadyExists: If a task with the same title already exists in the project.
    """

    if validations.task_exists(project_id=project_id, title=title):
        raise exceptions.TaskTitleAlreadyExists(project_id=project_id, title=title)

    return models.Task.new(
        title=title,
        project_id=project_id,
        priority=priority,
        description=description,
        due_date=due_date,
        assigned_to_id=assigned_to_id,
    )


def update_task(
    task: models.Task,
    title: str | None = None,
    status: constants.TaskStatus | None = None,
    priority: constants.TaskPriority | None = None,
    description: str | None = None,
    due_date: date | None = None,
    assigned_to: users_models.User | None = None,
) -> models.Task:
    """
    Update an existing task instance with the provided fields.

    This function performs a partial update on a Task object. It ensures that
    at least one field is provided; otherwise, it raises a ValueError. It also
    validates that the task title remains unique within the project if it is
    being changed.

    Args:
        task (models.Task): The task instance to be updated.
        title (str | None, optional): New title for the task.
        status (TaskStatus | None, optional): New status for the task.
        priority (TaskPriority | None, optional): New priority level for the task.
        description (str | None, optional): New description for the task.
        due_date (date | None, optional): New due date for the task.
        assigned_to (users_models.User | None, optional): User assigned to the task.

    Returns:
        models.Task: The updated task instance.

    Raises:
        ValueError: If no fields are provided for update.
        TaskTitleAlreadyExists: If the new title already exists within the project.
    """

    if all(
        value is None
        for value in (title, status, priority, description, due_date, assigned_to)
    ):
        raise ValueError("At least one field must be provided to update the task.")

    if (
        title
        and title != task.title
        and validations.task_exists(project_id=task.project_id, title=title)
    ):
        raise exceptions.TaskTitleAlreadyExists(project_id=task.project_id, title=title)

    task.title = title or task.title
    task.status = status or task.status
    task.priority = priority or task.priority
    task.description = description or task.description
    task.due_date = due_date or task.due_date
    task.assigned_to = assigned_to or task.assigned_to
    task.save()

    return task
