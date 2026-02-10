#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
API_DIR="$PROJECT_ROOT/api"
WEB_DIR="$PROJECT_ROOT/webapp"

if [ ! -d "$API_DIR" ]; then
  echo "error: $API_DIR not found"
  exit 1
fi
if [ ! -d "$WEB_DIR" ]; then
  echo "error: $WEB_DIR not found"
  exit 1
fi

MODE="${1:-run}"

pids=()

cleanup() {
  for p in "${pids[@]:-}"; do
    kill -TERM "$p" 2>/dev/null || true
  done
  sleep 1
  for p in "${pids[@]:-}"; do
    kill -0 "$p" 2>/dev/null || continue
    kill -KILL "$p" 2>/dev/null || true
  done
}

trap 'cleanup; exit 130' INT TERM
trap 'cleanup' EXIT

start_bg() {
  local dir=$1
  shift
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "warning: command '$1' not found in PATH" >&2
  fi
  (
    cd "$dir" || exit 1
    exec "$@"
  ) &
  pids+=("$!")
}

if [ "$MODE" = "dev" ]; then
  start_bg "$API_DIR" fastapi dev
  start_bg "$WEB_DIR" bun dev
else
  (
    cd "$WEB_DIR" || exit 1
    bun run build
  )
  start_bg "$API_DIR" fastapi run
  start_bg "$WEB_DIR" bun run preview
fi

if wait -n; then
  status=0
else
  status=$?
fi

cleanup
wait || true
exit ${status:-0}
