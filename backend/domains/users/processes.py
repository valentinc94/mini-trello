"""
Business processes for the users domain.

This module defines the high-level workflows and use cases for user management.
It acts as the central orchestrator, coordinating domain validations and
business rules to keep the API layer thin and strictly decoupled.
"""

from django.contrib.auth.models import User

from backend.domains.users import exceptions, validations


def register_user(
    username: str,
    password: str,
    email: str = "",
    first_name: str = "",
    last_name: str = "",
) -> User:
    """
    Register a new user after validating business rules.

    This function checks that no user with the given username already exists
    before creating the new user. Passwords are hashed automatically by
    Django's create_user manager method.

    Args:
        username: The desired username for the new user.
        password: The plain-text password (will be hashed).
        email: Optional email address for the user.
        first_name: Optional first name.
        last_name: Optional last name.

    Raises:
        UsernameAlreadyExists: If the username is already taken.

    Returns:
        User: The newly created Django User instance.
    """
    username = username.lower()

    if validations.username_exists(username=username):
        raise exceptions.UsernameAlreadyExists(username=username)

    return User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
