"""
Projects API views.

This module provides RESTful endpoints for managing Projects and Tasks.
Views are intentionally thin: they handle HTTP concerns (auth, parsing,
status codes) and delegate all business logic to the domain layer.

Endpoints:
    Projects:
        GET    /api/v1/projects/           → list owned projects (paginated)
        POST   /api/v1/projects/           → create a project
        GET    /api/v1/projects/<pk>/      → retrieve a project
        PATCH  /api/v1/projects/<pk>/      → update a project
        DELETE /api/v1/projects/<pk>/      → delete a project

    Tasks (nested under project):
        GET    /api/v1/projects/<pk>/tasks/    → list tasks (filterable + paginated)
        POST   /api/v1/projects/<pk>/tasks/    → create a task in project
        GET    /api/v1/tasks/<pk>/             → retrieve a task
        PATCH  /api/v1/tasks/<pk>/             → update a task
        DELETE /api/v1/tasks/<pk>/             → delete a task
"""

from django.contrib.auth.models import User
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.apps.projects import models
from backend.domains.projects import exceptions, processes, queries
from backend.interfaces.api.commons.pagination import StandardPagination
from backend.interfaces.api.projects import serializers

# ---------------------------------------------------------------------------
# Project Views
# ---------------------------------------------------------------------------


class ProjectListCreateView(APIView):
    """
    List all projects owned by the authenticated user, or create a new one.

    GET  /api/v1/projects/  → paginated list of the user's projects
    POST /api/v1/projects/  → create a new project
    """

    @extend_schema(
        responses=serializers.ProjectSerializer(many=True),
        operation_id="projects_list",
        summary="List user projects",
        tags=["Projects"],
    )
    def get(self, request):
        """
        Return a paginated list of projects owned by the requesting user.

        Returns:
            Response: 200 with paginated project list.
        """
        projects = queries.get_accessible_projects_for_user(user=request.user)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(projects, request)

        serializer = serializers.ProjectSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=serializers.ProjectCreateSerializer,
        responses={201: serializers.ProjectSerializer},
        operation_id="projects_create",
        summary="Create a project",
        tags=["Projects"],
    )
    def post(self, request):
        """
        Create a new project owned by the requesting user.

        Args:
            request: HTTP request containing 'name' and 'description'.

        Returns:
            Response: 201 with the created project data.

        Raises:
            400 Bad Request: If required fields are missing or invalid.
            409 Conflict: If a project with the same name already exists.
        """
        serializer = serializers.ProjectCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = processes.create_project(
                name=serializer.validated_data["name"],
                description=serializer.validated_data["description"],
                owner_id=request.user.id,
            )
        except exceptions.ProjectNameAlreadyExists:
            return Response(
                {"detail": "A project with this name already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            serializers.ProjectSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):
    """
    Retrieve, update or delete a specific project.

    GET    /api/v1/projects/<pk>/ → retrieve
    PATCH  /api/v1/projects/<pk>/ → partial update
    DELETE /api/v1/projects/<pk>/ → delete
    """

    def _get_project(self, pk: int, user) -> models.Project | None:
        """
        Retrieve a project if the user owns it or has tasks assigned within it.
        """
        return (
            models.Project.objects.filter(pk=pk)
            .filter(Q(owner=user) | Q(tasks__assigned_to=user))
            .distinct()
            .first()
        )

    @extend_schema(
        responses=serializers.ProjectSerializer,
        operation_id="projects_retrieve",
        summary="Retrieve a project",
        tags=["Projects"],
    )
    def get(self, request, pk: int):
        """
        Retrieve a project by primary key.

        Returns:
            Response: 200 with project data, or 404 if not found/not owned.
        """
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(serializers.ProjectSerializer(project).data)

    @extend_schema(
        request=serializers.ProjectUpdateSerializer,
        responses=serializers.ProjectSerializer,
        operation_id="projects_partial_update",
        summary="Update a project",
        tags=["Projects"],
    )
    def patch(self, request, pk: int):
        """
        Partially update a project.

        Args:
            request: HTTP request with optional 'name' and/or 'description'.

        Returns:
            Response: 200 with updated project data.

        Raises:
            400 Bad Request: If the payload is invalid.
            404 Not Found: If the project is not found or not owned.
            409 Conflict: If the new name is already taken.
        """
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if project.owner != request.user:
            return Response(
                {"detail": "You do not have permission to edit this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = serializers.ProjectUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated = processes.update_project(
                project=project,
                name=serializer.validated_data.get("name"),
                description=serializer.validated_data.get("description"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except exceptions.ProjectNameAlreadyExists:
            return Response(
                {"detail": "A project with this name already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(serializers.ProjectSerializer(updated).data)

    @extend_schema(
        responses={204: None},
        operation_id="projects_destroy",
        summary="Delete a project",
        tags=["Projects"],
    )
    def delete(self, request, pk: int):
        """
        Delete a project and all its tasks (cascade).

        Returns:
            Response: 204 No Content on success, 404 if not found.
        """
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if project.owner != request.user:
            return Response(
                {"detail": "You do not have permission to delete this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Task Views
# ---------------------------------------------------------------------------


class TaskListCreateView(APIView):
    """
    List tasks within a project or create a new task.

    Supports filtering via query params: ?status=to_do&priority=high&assigned_to=<id>

    GET  /api/v1/projects/<pk>/tasks/ → paginated, filterable task list
    POST /api/v1/projects/<pk>/tasks/ → create task in project
    """

    def _get_project(self, pk: int, user) -> models.Project | None:
        """Return a project if the user owns it or has tasks assigned within it."""
        return (
            models.Project.objects.filter(pk=pk)
            .filter(Q(owner=user) | Q(tasks__assigned_to=user))
            .distinct()
            .first()
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="status", description="Filter by status", required=False, type=str
            ),
            OpenApiParameter(
                name="priority",
                description="Filter by priority",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="assigned_to",
                description="Filter by assigned user ID",
                required=False,
                type=int,
            ),
        ],
        responses=serializers.TaskSerializer(many=True),
        operation_id="tasks_list",
        summary="List tasks for a project",
        tags=["Tasks"],
    )
    def get(self, request, pk: int):
        """
        Return a paginated, optionally filtered list of tasks for a project.

        Query params:
            status       (str): Filter by task status.
            priority     (str): Filter by task priority.
            assigned_to  (int): Filter by assigned user ID.

        Returns:
            Response: 200 with paginated task list, or 404 if project not found.
        """
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        tasks = queries.get_tasks_for_project(
            project=project,
            status=request.query_params.get("status"),
            priority=request.query_params.get("priority"),
            assigned_to_id=request.query_params.get("assigned_to"),
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(tasks, request)

        serializer = serializers.TaskSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=serializers.TaskCreateSerializer,
        responses={201: serializers.TaskSerializer},
        operation_id="tasks_create",
        summary="Create a task",
        tags=["Tasks"],
    )
    def post(self, request, pk: int):
        """
        Create a new task within the specified project.

        Args:
            request: HTTP request with task data.
            pk: Primary key of the project.

        Returns:
            Response: 201 with the created task data.

        Raises:
            400 Bad Request: If required fields are missing or invalid.
            404 Not Found: If the project is not found or not owned.
            409 Conflict: If a task with the same title already exists in the project.
        """
        project = self._get_project(pk, request.user)

        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = serializers.TaskCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            task = processes.create_task(
                title=data["title"],
                project_id=project.id,
                description=data.get("description", ""),
                priority=data.get("priority"),
                due_date=data.get("due_date"),
                assigned_to_id=data.get("assigned_to_id"),
            )
        except exceptions.TaskTitleAlreadyExists:
            return Response(
                {"detail": "A task with this title already exists in this project."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            serializers.TaskSerializer(task).data,
            status=status.HTTP_201_CREATED,
        )


class TaskDetailView(APIView):
    """
    Retrieve, update or delete a specific task.

    Access rules:
        - The project owner can perform all operations.
        - A user assigned to the task can retrieve and update it (but not delete).

    GET    /api/v1/tasks/<pk>/ → retrieve
    PATCH  /api/v1/tasks/<pk>/ → update
    DELETE /api/v1/tasks/<pk>/ → delete (owner only)
    """

    def _get_task_for_user(self, pk: int, user) -> models.Task | None:
        """
        Return a task if the user owns its project or is assigned to it.

        Returns None if the task doesn't exist or the user has no access.
        """
        return (
            models.Task.objects.select_related("project", "assigned_to")
            .filter(pk=pk)
            .filter(project__owner=user)
            .first()
            or models.Task.objects.select_related("project", "assigned_to")
            .filter(pk=pk, assigned_to=user)
            .first()
        )

    @extend_schema(
        responses=serializers.TaskSerializer,
        operation_id="tasks_retrieve",
        summary="Retrieve a task",
        tags=["Tasks"],
    )
    def get(self, request, pk: int):
        """
        Retrieve a task by primary key.

        Returns:
            Response: 200 with task data, or 404 if not found/no access.
        """
        task = self._get_task_for_user(pk, request.user)

        if not task:
            return Response(
                {"detail": "Task not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(serializers.TaskSerializer(task).data)

    @extend_schema(
        request=serializers.TaskUpdateSerializer,
        responses=serializers.TaskSerializer,
        operation_id="tasks_partial_update",
        summary="Update a task",
        tags=["Tasks"],
    )
    def patch(self, request, pk: int):
        """
        Partially update a task.

        All fields are optional. Validates choices for status and priority.

        Returns:
            Response: 200 with updated task data.

        Raises:
            400 Bad Request: If validation fails or no fields provided.
            404 Not Found: If task not found or user has no access.
            409 Conflict: If the new title conflicts with another task in the project.
        """
        task = self._get_task_for_user(pk, request.user)

        if not task:
            return Response(
                {"detail": "Task not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = serializers.TaskUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Resolve assigned_to User instance if provided
        assigned_to = None
        assigned_to_id = data.get("assigned_to_id")
        if assigned_to_id is not None:
            assigned_to = User.objects.filter(pk=assigned_to_id).first()

        try:
            updated = processes.update_task(
                task=task,
                title=data.get("title"),
                status=data.get("status"),
                priority=data.get("priority"),
                description=data.get("description"),
                due_date=data.get("due_date"),
                assigned_to=assigned_to,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except exceptions.TaskTitleAlreadyExists:
            return Response(
                {"detail": "A task with this title already exists in this project."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(serializers.TaskSerializer(updated).data)

    @extend_schema(
        responses={204: None},
        operation_id="tasks_destroy",
        summary="Delete a task",
        tags=["Tasks"],
    )
    def delete(self, request, pk: int):
        """
        Delete a task. Only the project owner can delete tasks.

        Returns:
            Response: 204 No Content on success, 403 if not owner, 404 if not found.
        """
        task = models.Task.objects.select_related("project").filter(pk=pk).first()

        if not task:
            return Response(
                {"detail": "Task not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if task.project.owner != request.user:
            return Response(
                {"detail": "Only the project owner can delete tasks."},
                status=status.HTTP_403_FORBIDDEN,
            )

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
