"""
Validation logic for the users domain.

This module contains functions to validate business rules
and existence checks for User entities before interacting
with the core database operations.
"""

from django.contrib.auth.models import User


def username_exists(username: str) -> bool:
    """
    Check if a user with the given username already exists in the database.

    Args:
        username: The exact username to look up.

    Returns:
        bool: True if a user with that username exists, False otherwise.
    """
    return User.objects.filter(username=username.lower()).exists()
