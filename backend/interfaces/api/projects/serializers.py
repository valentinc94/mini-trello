"""
Serializers for the Projects API.

This module defines DRF serializers for Project and Task models.
Serializers handle input validation and output representation,
keeping the view layer thin and focused on HTTP concerns only.
"""

from django.contrib.auth.models import User
from rest_framework import serializers

from backend.apps.projects import constants, models


class UserSummarySerializer(serializers.ModelSerializer):
    """
    Minimal read-only serializer for embedding user info in responses.

    Used to represent the owner of a project or the user assigned to a task
    without exposing sensitive fields like passwords.
    """

    class Meta:
        model = User
        fields = ["id", "username", "email"]
        read_only_fields = fields


class ProjectSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Project model.

    Used for both list and detail responses. The 'owner' field is
    read-only and injected from the request context in the view.
    """

    owner = UserSummarySerializer(read_only=True)

    class Meta:
        model = models.Project
        fields = ["id", "name", "description", "owner", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating a Project.

    The owner is not accepted from the client — it is injected
    from request.user in the view to prevent ownership spoofing.

    The 'name' uniqueness constraint is intentionally stripped from
    the serializer: validation is owned by the domain process which
    raises ProjectNameAlreadyExists, mapped to 409 by the view.
    """

    class Meta:
        model = models.Project
        fields = ["name", "description"]
        extra_kwargs = {
            # Remove the auto-injected UniqueValidator so the domain process
            # owns the uniqueness rule and the view can return 409 (not 400).
            "name": {"validators": []},
        }


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for partially updating a Project.

    Both fields are optional to support PATCH semantics.
    """

    name = serializers.CharField(max_length=50, required=False)
    description = serializers.CharField(max_length=255, required=False)

    class Meta:
        model = models.Project
        fields = ["name", "description"]


class TaskSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Task model.

    Used for both list and detail responses. Embeds the assigned user
    as a nested object and exposes status/priority display labels.
    """

    assigned_to = UserSummarySerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(
        source="get_priority_display", read_only=True
    )

    class Meta:
        model = models.Task
        fields = [
            "id",
            "title",
            "description",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "due_date",
            "assigned_to",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "created_at", "updated_at"]


class TaskCreateSerializer(serializers.Serializer):
    """
    Write serializer for creating a Task within a project.

    The 'project' FK is injected from the URL parameter in the view.
    """

    title = serializers.CharField(max_length=100)
    description = serializers.CharField(default="", allow_blank=True, required=False)
    priority = serializers.ChoiceField(
        choices=constants.TaskPriority.choices,
        default=constants.TaskPriority.MEDIUM,
        required=False,
    )
    due_date = serializers.DateField(required=False, allow_null=True)
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_assigned_to_id(self, value):
        """Ensure the assigned user exists if provided."""
        if value is not None and not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"User with id={value} does not exist.")
        return value


class TaskUpdateSerializer(serializers.Serializer):
    """
    Write serializer for partially updating a Task.

    All fields are optional to support PATCH semantics. Validates
    that status and priority are valid choices when provided.
    """

    title = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(allow_blank=True, required=False)
    status = serializers.ChoiceField(
        choices=constants.TaskStatus.choices, required=False
    )
    priority = serializers.ChoiceField(
        choices=constants.TaskPriority.choices, required=False
    )
    due_date = serializers.DateField(required=False, allow_null=True)
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_assigned_to_id(self, value):
        """Ensure the assigned user exists if provided."""
        if value is not None and not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"User with id={value} does not exist.")
        return value
