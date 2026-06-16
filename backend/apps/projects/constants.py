"""
Constants for the projects application.

This module contains enumeration classes and choices used across
the models to ensure data consistency and avoid magic strings.
"""

from django.db import models


class TaskStatus(models.TextChoices):
    """
    Status choices for a Task.

    Represents the current stage of a task in the Kanban board flow
    (To Do, In Progress, Done).
    """

    TO_DO = "to_do", "To Do"
    IN_PROGRESS = "in_progress", "In Progress"
    DONE = "done", "Done"


class TaskPriority(models.TextChoices):
    """
    Priority levels for a Task.

    Used to determine the urgency and importance of completing the task.
    Levels range from Low to Urgent.
    """

    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"
