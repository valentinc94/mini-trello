# Mini Trello (Enterprise Kanban Board)

A premium, production-ready, domain-driven Task Board application built with Django, Django REST Framework, PostgreSQL, and Next.js. Inspired by Linear and Notion, featuring a sleek, minimalist dark/light-accented interface, custom interactivity, and robust collaboration controls.

## Features

### Backend (Django)
- **Domain-Driven Architecture**: Clean separation between application entry points (API serializers, views) and core domain logic (validations, processes, exceptions).
- **Auto-migrating and Seeding**: Automatic migrations run on startup, with seed data (`demo` and `jane` users, default projects, and tasks) pre-loaded via custom Django commands.
- **RESTful API**: Thin controllers serving clean JSON responses with Swagger OpenAPI documentation.

### Frontend (Next.js 14 & Tailwind CSS)
- **Linear-inspired UI**: Minimalist layout featuring a collapsible/responsive sidebar, clean card grids, fluid hover interactions, and micro-animations.
- **Project Ownership Settings**: Project owners can edit names/descriptions or delete projects directly from the Kanban view with immediate dynamic sidebar sync.
- **Custom UI Select Controls**: Dropdowns (status, priority, assignee) are styled with custom menus, eliminating native browser select elements.
- **Real-Time Member Filters**: Filter board tasks dynamically by assigned members. The filter list updates automatically as tasks are modified or assigned without requiring F5.
- **Future-only Due Date Picker**: Premium Custom Date Picker ensuring tasks can only be scheduled for today or future dates.

---

## Setup & Execution

### 1. Build and Run the Containers
To construct the docker images and launch the application services (PostgreSQL, Django, Next.js, Nginx), run:

```bash
docker compose up --build
```
*Note: The database is automatically seeded and migrations are executed before startup.*

To run in the background (detached mode):
```bash
docker compose up -d --build
```

### 2. Stopping the Environment
To safely tear down the containers:
```bash
docker compose down
```

---

## Architecture Map
- **Nginx Entrypoint**: Accessible locally at `http://localhost/` (routes traffic to Next.js and forwards `/api/` requests to Django).
- **Backend (Django)**: Port `8000` inside the network.
- **Swagger API Docs**: Available at `http://localhost/api/docs/`
- **PostgreSQL Database**: Port `5432` inside the network.
- **Frontend (Next.js)**: Runs inside Next.js dev server on port `3000`.

---

## Running Unit Tests

### Backend Tests (Pytest)
Run the Python test suite inside the running Django container:
```bash
docker compose exec backend pytest tests/ -v
```

### Frontend Tests (Jest & React Testing Library)
Run the Jest test suite inside the `frontend/` directory:
```bash
# From the workspace root:
cd frontend
npm run test
```

This tests:
1. `LoginForm.test.tsx`: Validates rendering, validation feedback, credentials, quick login actions, and loading triggers.
2. `KanbanBoard.test.tsx`: Validates core board state, column groupings, filter criteria, and task detail modal opening.
