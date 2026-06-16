"""
Custom exceptions for the projects domain.
"""


class ProjectNameAlreadyExists(Exception):
    """
    Raised when attempting to create a project with a name that already exists.
    """

    def __init__(self, name: str):
        super().__init__(f"The project name '{name}' is already in use.")
        self.name = name


class TaskTitleAlreadyExists(Exception):
    """
    Raised when attempting to create a task with a title that already exists within the same project.
    """

    def __init__(self, project_id: int, title: str):
        message = (
            f"The task title '{title}' already exists in project with ID {project_id}."
        )
        super().__init__(message)
        self.project_id = project_id
        self.title = title
