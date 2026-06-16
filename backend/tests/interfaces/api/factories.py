"""
Factories for test data.

Uses factory_boy's DjangoModelFactory to produce consistent, realistic
test instances without coupling tests to specific fixture values.
Sequences guarantee uniqueness across tests in the same run.
"""

import factory
from django.contrib.auth.models import User as UserModel

from backend.apps.projects import constants
from backend.apps.projects.models import Project as ProjectModel
from backend.apps.projects.models import Task as TaskModel


class User(factory.django.DjangoModelFactory):
    class Meta:
        model = UserModel
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        # We handle setting the password via the model's set_password method
        # and explicitly saving if the instance is being persisted to the DB.
        password = extracted if extracted else "strongpass123"
        self.set_password(password)
        if create:
            self.save()


class Project(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectModel

    name = factory.Sequence(lambda n: f"Project {n}")
    description = "A test project."
    owner = factory.SubFactory(User)


class Task(factory.django.DjangoModelFactory):
    class Meta:
        model = TaskModel

    title = factory.Sequence(lambda n: f"Task {n}")
    description = "A test task."
    project = factory.SubFactory(Project)
    status = constants.TaskStatus.TO_DO
    priority = constants.TaskPriority.MEDIUM
