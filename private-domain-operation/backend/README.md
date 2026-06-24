# private-domain-operation backend

Go + Gin backend service for the private domain operation mini program.

## Requirements

- Go 1.25+ for backend development. The current local environment uses Go 1.26.3.

## Scripts

Run scripts from this directory:

```bash
./scripts/optools start
./scripts/optools status
./scripts/optools stop
./scripts/optools restart
```

Default runtime values:

- `APP_ENV=development`
- `GIN_MODE=debug`
- `HTTP_HOST=127.0.0.1`
- `HTTP_PORT=8088`
- `DAEMON_MODE=auto`
- `PID_FILE=run/pdo-backend.pid`
- `LOG_FILE=logs/pdo-backend.log`
- `BINARY_PATH=bin/pdo-backend`
- `GOCACHE=.cache/go-build`

On macOS, `DAEMON_MODE=auto` uses `launchd`. On other systems it falls back to `nohup`.

Example:

```bash
HTTP_PORT=18088 ./scripts/optools start
./scripts/optools status
FOLLOW=1 ./scripts/optools logs
./scripts/optools stop
```

The `start` command builds `./cmd/api` before launching the service as a daemon.

Other commands:

```bash
./scripts/optools build
./scripts/optools test
./scripts/optools logs 120
```
