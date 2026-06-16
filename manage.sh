#!/bin/bash
# Convenience wrapper to run Django management commands with the correct PYTHONPATH.
# Usage: ./manage.sh runserver
#        ./manage.sh migrate
#        ./manage.sh makemigrations

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

source "$SCRIPT_DIR/venv/bin/activate"
PYTHONPATH="$SCRIPT_DIR" python "$SCRIPT_DIR/backend/manage.py" "$@"
