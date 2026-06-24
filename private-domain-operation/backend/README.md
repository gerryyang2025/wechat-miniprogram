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
- `DATABASE_PATH=data/pdo.db`
- `MIGRATIONS_DIR=migrations`
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
./scripts/optools migrate
./scripts/optools seed
./scripts/optools logs 120
```

## SQLite and WeChat Login

Useful local environment variables:

- `DATABASE_PATH`: SQLite database path. Defaults to `data/pdo.db`.
- `MIGRATIONS_DIR`: migration directory. Defaults to `migrations`.
- `WECHAT_APP_ID`: Mini Program AppID for `wx.login`.
- `WECHAT_APP_SECRET`: Mini Program AppSecret for `code2session`.
- `TOKEN_SECRET`: HMAC token signing secret. Required for production.
- `MERCHANT_OPENIDS`: comma-separated openid whitelist for merchant role.

Database commands:

```bash
./scripts/optools migrate
./scripts/optools seed
DATABASE_PATH=$(pwd)/data/pdo-local.db ./scripts/optools seed
```

Local daemon example:

```bash
DATABASE_PATH=$(pwd)/data/pdo-local.db \
MERCHANT_OPENIDS=mock-openid-merchant \
DAEMON_MODE=nohup \
./scripts/optools start
```

For local Mini Program development, set `globalData.apiConfig.baseUrl` in `private-domain-operation/app.js` to the backend URL, for example `http://127.0.0.1:8088`. Keep `mockFallback: true` while developing if you want static fallback data when the backend is unavailable. For real device testing, use an HTTPS backend domain configured in the Mini Program console.
