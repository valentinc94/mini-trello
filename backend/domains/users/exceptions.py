"""
Custom exceptions for the users domain.
"""


class UsernameAlreadyExists(Exception):
    """
    Raised when attempting to register a user with a username that is already taken.
    """

    def __init__(self, username: str):
        super().__init__(f"The username '{username}' is already in use.")
        self.username = username
