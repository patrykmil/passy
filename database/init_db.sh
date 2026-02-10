#!/usr/bin/env bash
set -euo pipefail

if [ $# -eq 0 ]; then
  PROJECT_ROOT=""

  if repo_root=$(git rev-parse --show-toplevel 2>/dev/null || true); then
    if [ -n "$repo_root" ] && [ -f "$repo_root/database/init_db.sh" ]; then
      PROJECT_ROOT="$repo_root"
    fi
  fi

  if [ -z "${PROJECT_ROOT:-}" ]; then
    dir="$PWD"
    while [ "$dir" != "/" ] && [ -n "$dir" ]; do
      if [ -f "$dir/database/init_db.sh" ]; then
        PROJECT_ROOT="$dir"
        break
      fi
      dir=$(dirname "$dir")
    done
  fi

  if [ -z "${PROJECT_ROOT:-}" ]; then
    if [ -f "./database/init_db.sh" ]; then
      PROJECT_ROOT="$PWD"
    else
      echo "Usage: $0 [<project_root>]" >&2
      echo "Error: could not locate database/init_db.sh from $PWD" >&2
      exit 1
    fi
  fi
elif [ $# -eq 1 ]; then
  PROJECT_ROOT="$1"
else
  echo "Usage: $0 [<project_root>]" >&2
  exit 1
fi
SCRIPT_DIR="$PROJECT_ROOT/database"
DB="$SCRIPT_DIR/database.db"
SQL_DIR="$SCRIPT_DIR/sql"
CREATE_SQL="$SQL_DIR/create_tables.sql"
FILL_SQL="$SQL_DIR/fill_tables.sql"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Error: sqlite3 command not found." >&2
  exit 1
fi

if [ -f "$DB" ]; then
  echo "Database already exists at: $DB"
else
  echo "Creating database file: $DB"
  sqlite3 "$DB" "VACUUM;" >/dev/null 2>&1 || true
  echo "Created $DB"
fi

if [ -f "$CREATE_SQL" ]; then
  echo "Applying schema: $CREATE_SQL"
  sqlite3 "$DB" < "$CREATE_SQL"
  echo "Schema applied"
else
  echo "Error: create script not found: $CREATE_SQL" >&2
  exit 1
fi

if [ -f "$FILL_SQL" ]; then
  echo "Applying seed data: $FILL_SQL"
  sqlite3 "$DB" < "$FILL_SQL"
  echo "Seed data applied"
else
  echo "Warning: fill script not found: $FILL_SQL -- skipping" >&2
fi

echo "Database initialization complete. DB file: $DB"
