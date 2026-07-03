#!/usr/bin/env sh
set -eu

ACTION="${1:-start}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$REPO_ROOT/compose.yaml"
ENV_FILE="$REPO_ROOT/.env"
ENV_EXAMPLE="$REPO_ROOT/.env.example"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not available on PATH." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created .env from .env.example. Values are for local development only."
fi

compose() {
  docker compose --file "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

case "$ACTION" in
  start)
  compose up --detach --wait
  compose run --rm object-storage-init
  compose ps
    ;;
  stop)
    compose down --remove-orphans
    ;;
  status)
    compose ps
    ;;
  logs)
    compose logs --follow
    ;;
  reset)
    printf "Delete all local Project_MT database and object-storage data? Type RESET: "
    read -r confirmation
    if [ "$confirmation" != "RESET" ]; then
      echo "Reset cancelled."
      exit 0
    fi
    compose down --volumes --remove-orphans
    echo "Local Project_MT service data was deleted."
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs|reset}" >&2
    exit 2
    ;;
esac

