#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKEND_OPTOOLS="$BACKEND_DIR/scripts/optools"

APP_NAME="${APP_NAME:-pdo-backend}"
APP_ENV="${APP_ENV:-development}"
GIN_MODE="${GIN_MODE:-debug}"
HTTP_HOST="${HTTP_HOST:-127.0.0.1}"
HTTP_PORT="${HTTP_PORT:-8088}"
DAEMON_MODE="${DAEMON_MODE:-nohup}"

DATA_DIR="${DATA_DIR:-$PROJECT_DIR/data}"
BIN_DIR="${BIN_DIR:-$PROJECT_DIR/bin}"
RUN_DIR="${RUN_DIR:-$PROJECT_DIR/run}"
LOG_DIR="${LOG_DIR:-$PROJECT_DIR/log}"
GOCACHE="${GOCACHE:-$PROJECT_DIR/.cache/go-build}"
GOMODCACHE="${GOMODCACHE:-$PROJECT_DIR/.cache/go-mod}"

DATABASE_PATH="${DATABASE_PATH:-$DATA_DIR/pdo.db}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$BACKEND_DIR/migrations}"
BINARY_PATH="${BINARY_PATH:-$BIN_DIR/$APP_NAME}"
PID_FILE="${PID_FILE:-$RUN_DIR/$APP_NAME.pid}"
LOG_FILE="${LOG_FILE:-$LOG_DIR/$APP_NAME.log}"

WECHAT_APP_ID="${WECHAT_APP_ID:-}"
WECHAT_APP_SECRET="${WECHAT_APP_SECRET:-}"
TOKEN_SECRET="${TOKEN_SECRET:-}"
MERCHANT_OPENIDS="${MERCHANT_OPENIDS:-}"

command_name="${1:-help}"
if [ "$#" -gt 0 ]; then
  shift
fi

is_dry_run() {
  [ "${OPTOOLS_DRY_RUN:-0}" = "1" ]
}

ensure_backend_script() {
  if [ ! -x "$BACKEND_OPTOOLS" ]; then
    echo "backend optools script is missing or not executable: $BACKEND_OPTOOLS" >&2
    exit 1
  fi
}

ensure_go() {
  if ! command -v go >/dev/null 2>&1; then
    cat >&2 <<EOF
go command not found.

Install Go 1.25+ first, then rerun:
  brew install go
  ./optools.sh init
EOF
    exit 1
  fi
}

ensure_runtime_dirs() {
  mkdir -p "$BIN_DIR" "$RUN_DIR" "$LOG_DIR" "$DATA_DIR" "$GOCACHE" "$GOMODCACHE"
}

backend_env_args() {
  printf '%s\n' \
    "APP_NAME=$APP_NAME" \
    "APP_ENV=$APP_ENV" \
    "GIN_MODE=$GIN_MODE" \
    "HTTP_HOST=$HTTP_HOST" \
    "HTTP_PORT=$HTTP_PORT" \
    "DAEMON_MODE=$DAEMON_MODE" \
    "DATABASE_PATH=$DATABASE_PATH" \
    "MIGRATIONS_DIR=$MIGRATIONS_DIR" \
    "BIN_DIR=$BIN_DIR" \
    "RUN_DIR=$RUN_DIR" \
    "LOG_DIR=$LOG_DIR" \
    "GOCACHE=$GOCACHE" \
    "GOMODCACHE=$GOMODCACHE" \
    "BINARY_PATH=$BINARY_PATH" \
    "PID_FILE=$PID_FILE" \
    "LOG_FILE=$LOG_FILE" \
    "WECHAT_APP_ID=$WECHAT_APP_ID" \
    "WECHAT_APP_SECRET=$WECHAT_APP_SECRET" \
    "TOKEN_SECRET=$TOKEN_SECRET" \
    "MERCHANT_OPENIDS=$MERCHANT_OPENIDS" \
    "FOLLOW=${FOLLOW:-0}"
}

print_backend_dry_run() {
  local backend_command="$1"
  shift || true

  echo "Would run backend operation with:"
  backend_env_args
  echo "$BACKEND_OPTOOLS $backend_command $*"
}

run_backend() {
  local backend_command="$1"
  shift || true

  ensure_backend_script

  if is_dry_run; then
    print_backend_dry_run "$backend_command" "$@"
    return 0
  fi

  ensure_runtime_dirs

  (
    cd "$BACKEND_DIR"
    env \
      APP_NAME="$APP_NAME" \
      APP_ENV="$APP_ENV" \
      GIN_MODE="$GIN_MODE" \
      HTTP_HOST="$HTTP_HOST" \
      HTTP_PORT="$HTTP_PORT" \
      DAEMON_MODE="$DAEMON_MODE" \
      DATABASE_PATH="$DATABASE_PATH" \
      MIGRATIONS_DIR="$MIGRATIONS_DIR" \
      BIN_DIR="$BIN_DIR" \
      RUN_DIR="$RUN_DIR" \
      LOG_DIR="$LOG_DIR" \
      GOCACHE="$GOCACHE" \
      GOMODCACHE="$GOMODCACHE" \
      BINARY_PATH="$BINARY_PATH" \
      PID_FILE="$PID_FILE" \
      LOG_FILE="$LOG_FILE" \
      WECHAT_APP_ID="$WECHAT_APP_ID" \
      WECHAT_APP_SECRET="$WECHAT_APP_SECRET" \
      TOKEN_SECRET="$TOKEN_SECRET" \
      MERCHANT_OPENIDS="$MERCHANT_OPENIDS" \
      FOLLOW="${FOLLOW:-0}" \
      "$BACKEND_OPTOOLS" "$backend_command" "$@"
  )
}

init_environment() {
  ensure_backend_script

  if is_dry_run; then
    echo "Would initialize backend environment:"
    echo "mkdir -p $BIN_DIR $RUN_DIR $LOG_DIR $DATA_DIR $GOCACHE $GOMODCACHE"
    echo "cd $BACKEND_DIR && GOCACHE=$GOCACHE GOMODCACHE=$GOMODCACHE go mod download"
    return 0
  fi

  ensure_go
  ensure_runtime_dirs

  echo "Go version:"
  go version

  echo "Downloading backend Go dependencies..."
  (
    cd "$BACKEND_DIR"
    GOCACHE="$GOCACHE" GOMODCACHE="$GOMODCACHE" go mod download
  )

  echo "Environment initialized."
  echo "Runtime directories:"
  echo "  bin:  $BIN_DIR"
  echo "  run:  $RUN_DIR"
  echo "  log:  $LOG_DIR"
  echo "  data: $DATA_DIR"
  echo "  cache: $PROJECT_DIR/.cache"
}

logs_service() {
  local follow="0"
  local lines="80"

  while [ "$#" -gt 0 ]; do
    case "$1" in
      -f|--follow)
        follow="1"
        shift
        ;;
      *)
        lines="$1"
        shift
        ;;
    esac
  done

  FOLLOW="$follow" run_backend logs "$lines"
}

smoke_service() {
  local url="http://$HTTP_HOST:$HTTP_PORT"

  if is_dry_run; then
    echo "Would run smoke test:"
    print_backend_dry_run restart
    print_backend_dry_run status
    echo "curl -fsS $url/api/v1/health"
    echo "curl -fsS $url/api/v1/live-events"
    print_backend_dry_run stop
    return 0
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl command not found. Install curl or run start/status manually." >&2
    exit 1
  fi

  run_backend restart
  trap 'run_backend stop >/dev/null 2>&1 || true' EXIT
  run_backend status

  echo "Checking health endpoint..."
  curl -fsS "$url/api/v1/health"
  echo

  echo "Checking live-events endpoint..."
  local live_response
  live_response="$(curl -fsS "$url/api/v1/live-events")"
  echo "$live_response"
  if ! printf '%s' "$live_response" | grep -q '"liveList"'; then
    echo "live-events smoke response did not contain liveList." >&2
    exit 1
  fi

  run_backend stop
  trap - EXIT
}

show_help() {
  cat <<EOF
Usage:
  ./optools.sh <command> [args]

Commands:
  init       Initialize backend environment and download Go dependencies
  build      Build backend binary
  start      Build and start backend as daemon
  stop       Stop backend daemon
  restart    Stop and start backend daemon
  status     Show backend daemon status
  logs [n]   Show last n log lines, default 80
  logs -f [n] Follow backend log, default last 80 lines
  test       Run backend go test ./...
  migrate    Run database migrations
  seed       Run database migrations and seed minimal data
  smoke      Restart backend, check health/live-events, then stop
  help       Show this help

Defaults:
  HTTP_HOST=$HTTP_HOST
  HTTP_PORT=$HTTP_PORT
  DAEMON_MODE=$DAEMON_MODE
  DATABASE_PATH=$DATABASE_PATH
  LOG_FILE=$LOG_FILE
  PID_FILE=$PID_FILE
  GOCACHE=$GOCACHE
  GOMODCACHE=$GOMODCACHE

Examples:
  ./optools.sh init
  ./optools.sh restart
  ./optools.sh status
  ./optools.sh logs -f
  HTTP_PORT=18088 ./optools.sh smoke
EOF
}

case "$command_name" in
  init)
    init_environment "$@"
    ;;
  build|start|stop|restart|status|test|migrate|seed)
    run_backend "$command_name" "$@"
    ;;
  logs)
    logs_service "$@"
    ;;
  smoke)
    smoke_service "$@"
    ;;
  help|-h|--help)
    show_help
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    show_help >&2
    exit 2
    ;;
esac
