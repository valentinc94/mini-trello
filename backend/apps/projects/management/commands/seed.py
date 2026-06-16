from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from backend.apps.projects import constants, models
from backend.domains.projects import processes as project_processes
from backend.domains.users import processes as user_processes


class Command(BaseCommand):
    help = "Seeds the database with demo data."

    DEMO_USERS = [
        dict(
            username="demo",
            password="password123",
            email="demo@smartnsales.com",
            first_name="Demo",
            last_name="Reviewer",
        ),
        dict(
            username="jane",
            password="password123",
            email="jane@smartnsales.com",
            first_name="Jane",
            last_name="Manager",
        ),
    ]

    def handle(self, *args, **options):
        self.stdout.write("Starting seed process...")

        users = self._create_users()
        demo_user = users["demo"]
        jane_user = users["jane"]

        self._create_projects(demo_user, jane_user)

        self.stdout.write(self.style.SUCCESS("Database seeding completed."))

    def _create_users(self):
        created_users = {}

        for data in self.DEMO_USERS:
            user, created = self._get_or_create_user(data)
            created_users[data["username"]] = user

            msg = "Created" if created else "Exists"
            self.stdout.write(f"{msg} user: {user.username}")

        return created_users

    def _get_or_create_user(self, data):
        user = User.objects.filter(username=data["username"]).first()

        if user:
            return user, False

        user = user_processes.register_user(**data)
        return user, True

    def _get_or_create_project(self, name, description, owner_id):
        project = models.Project.objects.filter(name=name).first()
        if project:
            return project, False

        project = project_processes.create_project(
            name=name,
            description=description,
            owner_id=owner_id,
        )
        return project, True

    def _create_projects(self, demo_user, jane_user):
        self._create_dach_project(demo_user, jane_user)
        self._create_internal_ops_project(demo_user, jane_user)

    def _create_dach_project(self, demo_user, jane_user):
        project, created = self._get_or_create_project(
            name="DACH Retail Expansion",
            description="Coordination of 120 new store rollout in DACH region.",
            owner_id=demo_user.id,
        )

        msg = "Created" if created else "Exists"
        self.stdout.write(self.style.SUCCESS(f"{msg} project: {project.name}"))

        if not created:
            return

        tasks = [
            dict(
                title="Sign lease for Berlin flagship",
                description="Finalize paperwork with real estate agency.",
                status=constants.TaskStatus.DONE,
                priority=constants.TaskPriority.URGENT,
                assigned_to_id=demo_user.id,
                due_date="2026-06-01",
            ),
            dict(
                title="Hire regional manager",
                description="Final interviews for Munich district.",
                status=constants.TaskStatus.IN_PROGRESS,
                priority=constants.TaskPriority.HIGH,
                assigned_to_id=demo_user.id,
                due_date="2026-06-25",
            ),
            dict(
                title="Coordinate logistics for stock",
                description="Prepare warehouse for initial inventory.",
                status=constants.TaskStatus.TO_DO,
                priority=constants.TaskPriority.MEDIUM,
                assigned_to_id=jane_user.id,
                due_date="2026-07-10",
            ),
            dict(
                title="Setup local marketing campaign",
                description="Sync with PR team for launch week.",
                status=constants.TaskStatus.TO_DO,
                priority=constants.TaskPriority.LOW,
                assigned_to_id=demo_user.id,
            ),
        ]

        self._create_tasks(project.id, tasks)

    def _create_internal_ops_project(self, demo_user, jane_user):
        project, created = self._get_or_create_project(
            name="Q3 Internal Operations",
            description="Tracking internal goals and HR improvements.",
            owner_id=demo_user.id,
        )

        msg = "Created" if created else "Exists"
        self.stdout.write(self.style.SUCCESS(f"{msg} project: {project.name}"))

        if not created:
            return

        self._create_tasks(
            project.id,
            [
                dict(
                    title="Update employee handbook",
                    description="Add remote work policies.",
                    status=constants.TaskStatus.IN_PROGRESS,
                    priority=constants.TaskPriority.MEDIUM,
                    assigned_to_id=jane_user.id,
                )
            ],
        )

    def _create_tasks(self, project_id, tasks):
        for task_data in tasks:
            status = task_data.pop("status", constants.TaskStatus.TO_DO)
            task = project_processes.create_task(project_id=project_id, **task_data)

            if status != constants.TaskStatus.TO_DO:
                project_processes.update_task(task, status=status)
