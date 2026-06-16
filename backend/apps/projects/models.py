"""
Models for the projects app.

This module contains the database models for managing Projects and Tasks
within the task management system.
"""

import datetime
from typing import Optional

from django.conf import settings
from django.db import models

from backend.apps.projects import constants


class Project(models.Model):
    """
    Project model.

    Represents a project board owned by a user. A project groups multiple tasks
    and serves as the main organizational unit within the task management system.

    Attributes:
        name: Unique project name.
        description: Short project description.
        owner: User who owns the project.
        created_at: Timestamp when the project was created.
        updated_at: Timestamp when the project was last modified.
    """

    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Project name.",
    )
    description = models.CharField(
        max_length=255,
        help_text="Short project description.",
    )
    owner = models.ForeignKey(
        to=settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
        help_text="User who owns the project.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "projects"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name

    @classmethod
    def new(
        cls,
        *,
        name: str,
        description: str,
        owner_id: int,
    ) -> "Project":
        """Factory method to create a new Project instance."""
        return cls.objects.create(
            name=name,
            description=description,
            owner_id=owner_id,
        )


class Task(models.Model):
    """
    Task model.

    Represents a single piece of work within a Project.
    Tasks can be assigned to users and tracked via status and priority.

    Attributes:
        title: Title of the task.
        description: Detailed description of the task.
        status: Current status of the task (To Do, In Progress, Done).
        priority: Priority level of the task (Low, Medium, High, Urgent).
        due_date: Date when the task is due.
        assigned_to: User assigned to complete the task.
        project: The project this task belongs to.
        created_at: Timestamp when the task was created.
        updated_at: Timestamp when the task was last modified.
    """

    title = models.CharField(
        max_length=100,
        help_text="Title of the task.",
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the task.",
    )
    status = models.CharField(
        max_length=20,
        choices=constants.TaskStatus.choices,
        default=constants.TaskStatus.TO_DO,
        help_text="Current status of the task.",
    )
    priority = models.CharField(
        max_length=20,
        choices=constants.TaskPriority.choices,
        default=constants.TaskPriority.MEDIUM,
        help_text="Priority level of the task.",
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when the task is due.",
    )
    assigned_to = models.ForeignKey(
        to=settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
        help_text="User assigned to complete the task.",
    )
    project = models.ForeignKey(
        to=Project,
        on_delete=models.CASCADE,
        related_name="tasks",
        help_text="The project this task belongs to.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "tasks"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.project.name})"

    @classmethod
    def new(
        cls,
        *,
        title: str,
        project_id: int,
        description: str = "",
        status: str = constants.TaskStatus.TO_DO,
        priority: str = constants.TaskPriority.MEDIUM,
        due_date: Optional[datetime.date] = None,
        assigned_to_id: Optional[int] = None,
    ) -> "Task":
        """Factory method to create a new Task instance."""
        return cls.objects.create(
            title=title,
            project_id=project_id,
            description=description,
            status=status,
            priority=priority,
            due_date=due_date,
            assigned_to_id=assigned_to_id,
        )
