"""
Projects API URL configuration.

Endpoints:
    Projects:
        GET    /api/v1/projects/           List owned projects (paginated)
        POST   /api/v1/projects/           Create a project
        GET    /api/v1/projects/<pk>/      Retrieve a project
        PATCH  /api/v1/projects/<pk>/      Update a project
        DELETE /api/v1/projects/<pk>/      Delete a project

    Tasks (nested under project for creation/listing):
        GET    /api/v1/projects/<pk>/tasks/  List project tasks (filterable, paginated)
        POST   /api/v1/projects/<pk>/tasks/  Create task in project

    Tasks (standalone for detail operations):
        GET    /api/v1/tasks/<pk>/           Retrieve a task
        PATCH  /api/v1/tasks/<pk>/           Update a task
        DELETE /api/v1/tasks/<pk>/           Delete a task
"""

from django.urls import path

from backend.interfaces.api.projects import views

app_name = "projects_api"

urlpatterns = [
    # --- Projects ---
    path(
        "api/v1/projects/",
        views.ProjectListCreateView.as_view(),
        name="project-list-create",
    ),
    path(
        "api/v1/projects/<int:pk>/",
        views.ProjectDetailView.as_view(),
        name="project-detail",
    ),
    # --- Tasks (nested under project) ---
    path(
        "api/v1/projects/<int:pk>/tasks/",
        views.TaskListCreateView.as_view(),
        name="task-list-create",
    ),
    # --- Tasks (standalone detail) ---
    path(
        "api/v1/tasks/<int:pk>/",
        views.TaskDetailView.as_view(),
        name="task-detail",
    ),
]
