# Live Management Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real live-event loop: merchant creates and edits live events, users read live list/detail from SQLite, and entering live/replay requires backend access validation before opening an HTTPS link.

**Architecture:** Extend the existing SQLite schema and seed data, then add a focused live repository/service/handler stack following the current course-edit pattern. The frontend keeps the existing interface-first/mock-fallback approach, adds a merchant live edit page, and makes `live-room` an access gateway that opens `web-viewer` or copies the link after a backend decision.

**Tech Stack:** Go 1.25, Gin, SQLite via `modernc.org/sqlite`, WeChat Mini Program JavaScript/WXML/WXSS, existing `services/api/page-data.js` and `utils/navigation.js`.

---

## File Structure

Backend schema and seed:

- Modify: `private-domain-operation/backend/migrations/000001_p0_schema.up.sql`
  - Add live URL, replay URL, summary, visibility, status override, and replay flags to `live_events`.
  - Add `content_access_grants`.
  - Keep existing `live_access_rules` table for historical compatibility, but new access checks read `content_access_grants`.
- Modify: `private-domain-operation/backend/migrations/000001_p0_schema.down.sql`
  - Drop `content_access_grants` before dropping dependent content tables.
- Modify: `private-domain-operation/backend/internal/db/db_test.go`
  - Assert new table and important live columns exist.
- Modify: `private-domain-operation/backend/internal/db/seed.go`
  - Seed live events and course/bootcamp/member grants.
- Modify: `private-domain-operation/backend/internal/db/seed_test.go`
  - Assert live seed and grant seed are idempotent.

Backend domain, repository, service, and handler:

- Modify: `private-domain-operation/backend/internal/domain/models.go`
  - Add live DTOs for list/detail/room/edit/access flows.
- Create: `private-domain-operation/backend/internal/repository/live_repository.go`
  - Own SQLite reads/writes for live events and content access grants.
- Create: `private-domain-operation/backend/internal/repository/live_repository_test.go`
  - Test list/detail/edit/save/access option/grant behavior against migrated SQLite.
- Create: `private-domain-operation/backend/internal/service/live_service.go`
  - Validate merchant payloads, infer effective status, enforce HTTPS URLs, and run access checks.
- Create: `private-domain-operation/backend/internal/service/live_service_test.go`
  - Test validation, status inference, and access decision shape.
- Create: `private-domain-operation/backend/internal/handler/live.go`
  - Add user and merchant live handlers.
- Modify: `private-domain-operation/backend/internal/handler/auth.go`
  - Add `Live *service.LiveService` to `Dependencies`.
- Modify: `private-domain-operation/backend/internal/handler/router.go`
  - Wire real live routes and add `POST /api/v1/live-events/:live_id/access-check`, merchant create/edit/update/access-options routes.
- Modify: `private-domain-operation/backend/internal/handler/page_data.go`
  - Remove the static live handler implementations so `live.go` owns live behavior.
- Modify: `private-domain-operation/backend/internal/handler/router_test.go`
  - Add integration tests for user live read/access and merchant create/edit.
- Modify: `private-domain-operation/backend/cmd/api/main.go`
  - Instantiate `repository.NewLiveRepository` and `service.NewLiveService`.

Frontend API and pages:

- Modify: `private-domain-operation/services/api/page-data.js`
  - Add live edit, save, create, access-options, and access-check API functions.
- Modify: `private-domain-operation/utils/navigation.js`
  - Add helpers for `live-edit` and `web-viewer`, and allow live mode `ended`.
- Modify: `private-domain-operation/app.json`
  - Register `pages/live-edit/live-edit` and `pages/web-viewer/web-viewer`.
- Modify: `private-domain-operation/pages/live-management/live-management.js`
  - Make create/edit actions navigate to `live-edit`.
- Modify: `private-domain-operation/pages/live-management/live-management.wxml`
  - Bind action by `liveId`, not title text.
- Create: `private-domain-operation/pages/live-edit/live-edit.js`
  - Merchant edit form controller.
- Create: `private-domain-operation/pages/live-edit/live-edit.wxml`
  - Merchant edit form layout.
- Create: `private-domain-operation/pages/live-edit/live-edit.wxss`
  - Form styles aligned with `course-edit`.
- Create: `private-domain-operation/pages/live-edit/live-edit.json`
  - Custom navigation config.
- Modify: `private-domain-operation/pages/live-detail/live-detail.js`
  - Ensure primary action passes live ID and mode to the gateway.
- Modify: `private-domain-operation/pages/live-room/live-room.js`
  - Call access-check on load, then navigate to web-viewer or display denied/copy state.
- Modify: `private-domain-operation/pages/live-room/live-room.wxml`
  - Render access-denied and copy-link states without exposing links before backend approval.
- Modify: `private-domain-operation/pages/live-room/live-room.wxss`
  - Style access decision states.
- Create: `private-domain-operation/pages/web-viewer/web-viewer.js`
  - Decode and validate HTTPS target URL.
- Create: `private-domain-operation/pages/web-viewer/web-viewer.wxml`
  - Render `web-view` when valid, otherwise render copy fallback.
- Create: `private-domain-operation/pages/web-viewer/web-viewer.wxss`
  - Minimal fallback styling.
- Create: `private-domain-operation/pages/web-viewer/web-viewer.json`
  - Custom navigation config.
- Modify: `private-domain-operation/mock/live-data.js`
  - Add fallback functions for live edit/access flows.

Docs:

- Modify: `private-domain-operation/README.md`
  - Record live management/access endpoints and local verification flow.
- Modify: `private-domain-operation/TODO.md`
  - Mark live access as the next active implementation item and keep media delivery as link-first.

---

### Task 1: Extend SQLite Schema And Seed Data

**Files:**
- Modify: `private-domain-operation/backend/migrations/000001_p0_schema.up.sql`
- Modify: `private-domain-operation/backend/migrations/000001_p0_schema.down.sql`
- Modify: `private-domain-operation/backend/internal/db/db_test.go`
- Modify: `private-domain-operation/backend/internal/db/seed.go`
- Modify: `private-domain-operation/backend/internal/db/seed_test.go`

- [ ] **Step 1: Write failing migration tests**

Add these assertions to `TestOpenAndMigrateCreatesCoreTables` in `private-domain-operation/backend/internal/db/db_test.go`:

```go
	assertTableExists(t, conn, "content_access_grants")
	assertColumnExists(t, conn, "live_events", "summary")
	assertColumnExists(t, conn, "live_events", "status_override")
	assertColumnExists(t, conn, "live_events", "live_url")
	assertColumnExists(t, conn, "live_events", "replay_url")
	assertColumnExists(t, conn, "live_events", "visibility")
	assertColumnExists(t, conn, "live_events", "visibility_ref_id")
	assertColumnExists(t, conn, "live_events", "replay_enabled")
```

Add this helper below `assertTableExists`:

```go
func assertColumnExists(t *testing.T, conn *sql.DB, table string, column string) {
	t.Helper()

	rows, err := conn.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		t.Fatalf("column check for %s.%s failed: %v", table, column, err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var typ string
		var notNull int
		var defaultValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &typ, &notNull, &defaultValue, &pk); err != nil {
			t.Fatalf("scan table_info for %s failed: %v", table, err)
		}
		if name == column {
			return
		}
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("table_info rows for %s failed: %v", table, err)
	}
	t.Fatalf("column %s.%s does not exist", table, column)
}
```

- [ ] **Step 2: Run migration test and confirm failure**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/db -run TestOpenAndMigrateCreatesCoreTables -count=1
```

Expected: FAIL because `content_access_grants` or the new `live_events` columns do not exist.

- [ ] **Step 3: Update migration schema**

Replace the current `live_events` table definition in `private-domain-operation/backend/migrations/000001_p0_schema.up.sql` with:

```sql
CREATE TABLE live_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  speaker TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  start_at TEXT,
  end_at TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  status_override TEXT NOT NULL DEFAULT '',
  live_url TEXT NOT NULL DEFAULT '',
  replay_url TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'all',
  visibility_ref_id INTEGER,
  replay_enabled INTEGER NOT NULL DEFAULT 0,
  replay_media_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_events_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  CONSTRAINT fk_live_events_replay_media FOREIGN KEY (replay_media_id) REFERENCES media_assets(id)
);
```

Add these indexes after the existing live indexes:

```sql
CREATE INDEX idx_live_events_visibility ON live_events(visibility, visibility_ref_id);
CREATE INDEX idx_live_events_status_override ON live_events(status_override);
```

Add this table after `live_access_rules`:

```sql
CREATE TABLE content_access_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_type TEXT NOT NULL,
  access_ref_id INTEGER NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'seed',
  source_id TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_access_grants_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uk_content_access_grants_unique
  ON content_access_grants(user_id, access_type, access_ref_id, source_type, source_id);
CREATE INDEX idx_content_access_grants_lookup
  ON content_access_grants(user_id, access_type, access_ref_id, status);
CREATE INDEX idx_content_access_grants_source
  ON content_access_grants(source_type, source_id);
```

Update `private-domain-operation/backend/migrations/000001_p0_schema.down.sql` so the first lines are:

```sql
DROP TABLE IF EXISTS operation_slots;
DROP TABLE IF EXISTS content_access_grants;
DROP TABLE IF EXISTS live_access_rules;
DROP TABLE IF EXISTS live_events;
```

- [ ] **Step 4: Run migration test and confirm pass**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/db -run TestOpenAndMigrateCreatesCoreTables -count=1
```

Expected: PASS.

- [ ] **Step 5: Write failing seed tests**

Add this test to `private-domain-operation/backend/internal/db/seed_test.go`:

```go
func TestSeedMinimalCreatesLiveEventsAndAccessGrants(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn, err := Open(filepath.Join(t.TempDir(), "pdo.db"))
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	if err := Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := SeedMinimal(ctx, conn, SeedOptions{}); err != nil {
		t.Fatalf("first seed returned error: %v", err)
	}
	if err := SeedMinimal(ctx, conn, SeedOptions{}); err != nil {
		t.Fatalf("second seed returned error: %v", err)
	}

	var liveCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM live_events").Scan(&liveCount); err != nil {
		t.Fatalf("live count failed: %v", err)
	}
	if liveCount != 4 {
		t.Fatalf("live count = %d, want 4", liveCount)
	}

	var courseGrantCount int
	if err := conn.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM content_access_grants
		WHERE user_id = 2 AND access_type = 'course' AND access_ref_id = 1 AND status = 'active'
	`).Scan(&courseGrantCount); err != nil {
		t.Fatalf("course grant count failed: %v", err)
	}
	if courseGrantCount != 1 {
		t.Fatalf("course grant count = %d, want 1", courseGrantCount)
	}

	var memberGrantCount int
	if err := conn.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM content_access_grants
		WHERE user_id = 2 AND access_type = 'member' AND access_ref_id = 1 AND status = 'active'
	`).Scan(&memberGrantCount); err != nil {
		t.Fatalf("member grant count failed: %v", err)
	}
	if memberGrantCount != 1 {
		t.Fatalf("member grant count = %d, want 1", memberGrantCount)
	}
}
```

- [ ] **Step 6: Run seed test and confirm failure**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/db -run TestSeedMinimalCreatesLiveEventsAndAccessGrants -count=1
```

Expected: FAIL because seed data has no live events or access grants yet.

- [ ] **Step 7: Add seed data**

Append these SQL statements to the `statements := []string{...}` slice in `private-domain-operation/backend/internal/db/seed.go`, after `operation_slots`:

```go
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (1, 1, '私域运营直播答疑', '围绕内容变现、训练营承接和直播后复盘动作。', 'Gerry', 'https://media.example.com/covers/live/private-domain-qa.jpg', '2026-06-25T20:00:00+08:00', '2026-06-25T21:30:00+08:00', 'upcoming', '', 'https://media.example.com/live/private-domain-qa.m3u8', 'https://media.example.com/replay/private-domain-qa.mp4', 'course', 1, 1)`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (2, 1, '内容门诊室：短视频表达即时答疑', '聚焦短视频表达与镜头状态的即时答疑。', 'Gerry', 'https://media.example.com/covers/live/content-clinic.jpg', '2026-06-25T19:30:00+08:00', '2026-06-25T20:30:00+08:00', 'live', 'live', 'https://media.example.com/live/content-clinic.m3u8', '', 'member', 1, 0)`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (3, 1, '7 天训练营复盘直播回放', '针对训练营作业和打卡内容集中复盘。', 'Gerry', 'https://media.example.com/covers/live/bootcamp-review.jpg', '2026-06-20T20:00:00+08:00', '2026-06-20T20:45:00+08:00', 'ended', 'replay', 'https://media.example.com/live/bootcamp-review.m3u8', 'https://media.example.com/replay/bootcamp-review.mp4', 'bootcamp', 1, 1)`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (4, 1, '公开体验直播：知识产品起步', '面向全部登录用户的体验直播。', 'Gerry', 'https://media.example.com/covers/live/open-session.jpg', '2026-06-26T20:00:00+08:00', '2026-06-26T21:00:00+08:00', 'upcoming', '', 'https://media.example.com/live/open-session.m3u8', '', 'all', NULL, 0)`,
		`INSERT OR IGNORE INTO content_access_grants (id, user_id, access_type, access_ref_id, source_type, source_id, status)
		 VALUES (1, 2, 'course', 1, 'seed', 'course-1', 'active')`,
		`INSERT OR IGNORE INTO content_access_grants (id, user_id, access_type, access_ref_id, source_type, source_id, status)
		 VALUES (2, 2, 'bootcamp', 1, 'seed', 'bootcamp-1', 'active')`,
		`INSERT OR IGNORE INTO content_access_grants (id, user_id, access_type, access_ref_id, source_type, source_id, status)
		 VALUES (3, 2, 'member', 1, 'seed', 'member-1', 'active')`,
```

- [ ] **Step 8: Run db package tests**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/db -count=1
```

Expected: PASS.

- [ ] **Step 9: Commit schema and seed work**

Run:

```bash
git add private-domain-operation/backend/migrations/000001_p0_schema.up.sql private-domain-operation/backend/migrations/000001_p0_schema.down.sql private-domain-operation/backend/internal/db/db_test.go private-domain-operation/backend/internal/db/seed.go private-domain-operation/backend/internal/db/seed_test.go
git commit -m "feat: seed live events and access grants"
```

Expected: commit created.

---

### Task 2: Add Live Domain Models And Repository

**Files:**
- Modify: `private-domain-operation/backend/internal/domain/models.go`
- Create: `private-domain-operation/backend/internal/repository/live_repository.go`
- Create: `private-domain-operation/backend/internal/repository/live_repository_test.go`

- [ ] **Step 1: Add failing repository tests**

Create `private-domain-operation/backend/internal/repository/live_repository_test.go`:

```go
package repository

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	appdb "private-domain-operation/backend/internal/db"
	"private-domain-operation/backend/internal/domain"
)

func TestLiveRepositoryListsAndLoadsSeedLiveEvents(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	items, err := repo.ListLiveEvents(ctx, domain.LiveListFilter{Status: "all"})
	if err != nil {
		t.Fatalf("ListLiveEvents returned error: %v", err)
	}
	if len(items) != 4 {
		t.Fatalf("live items = %d, want 4", len(items))
	}
	if items[0].ID == "" || items[0].Title == "" || items[0].EffectiveStatus == "" {
		t.Fatalf("first item is incomplete: %#v", items[0])
	}

	detail, err := repo.GetLiveDetail(ctx, 1)
	if err != nil {
		t.Fatalf("GetLiveDetail returned error: %v", err)
	}
	if detail.Title != "私域运营直播答疑" {
		t.Fatalf("detail title = %q", detail.Title)
	}
	if detail.Visibility != "course" {
		t.Fatalf("visibility = %q, want course", detail.Visibility)
	}
}

func TestLiveRepositorySavesMerchantLiveEvent(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	payload := domain.LiveEditPayload{
		Title:           "新增直播",
		Summary:         "新增直播简介",
		Speaker:         "Gerry",
		CoverURL:        "https://media.example.com/covers/live/new.jpg",
		StartAt:         "2026-06-27T20:00:00+08:00",
		EndAt:           "2026-06-27T21:00:00+08:00",
		StatusOverride:  "upcoming",
		LiveURL:         "https://media.example.com/live/new.m3u8",
		ReplayURL:       "",
		Visibility:      "all",
		VisibilityRefID: 0,
		ReplayEnabled:   false,
	}

	created, err := repo.CreateLiveEvent(ctx, 1, payload)
	if err != nil {
		t.Fatalf("CreateLiveEvent returned error: %v", err)
	}
	if created.ID == 0 {
		t.Fatalf("created id = 0")
	}

	payload.Title = "新增直播 - 已编辑"
	payload.Visibility = "course"
	payload.VisibilityRefID = 1
	updated, err := repo.UpdateLiveEvent(ctx, created.ID, payload)
	if err != nil {
		t.Fatalf("UpdateLiveEvent returned error: %v", err)
	}
	if updated.Title != "新增直播 - 已编辑" {
		t.Fatalf("updated title = %q", updated.Title)
	}
	if updated.Visibility != "course" || updated.VisibilityRefID != 1 {
		t.Fatalf("updated visibility = %s/%d", updated.Visibility, updated.VisibilityRefID)
	}
}

func TestLiveRepositoryChecksContentAccessGrants(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	allowed, err := repo.HasActiveGrant(ctx, 2, "course", 1)
	if err != nil {
		t.Fatalf("HasActiveGrant returned error: %v", err)
	}
	if !allowed {
		t.Fatal("seed student should have course access")
	}

	denied, err := repo.HasActiveGrant(ctx, 999, "course", 1)
	if err != nil {
		t.Fatalf("HasActiveGrant for missing user returned error: %v", err)
	}
	if denied {
		t.Fatal("missing user should not have course access")
	}
}

func testLiveDB(t *testing.T, ctx context.Context) *sql.DB {
	t.Helper()

	conn, err := appdb.Open(filepath.Join(t.TempDir(), "pdo.db"))
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	if err := appdb.Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		conn.Close()
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := appdb.SeedMinimal(ctx, conn, appdb.SeedOptions{}); err != nil {
		conn.Close()
		t.Fatalf("SeedMinimal returned error: %v", err)
	}
	return conn
}
```

- [ ] **Step 2: Run repository tests and confirm failure**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/repository -run LiveRepository -count=1
```

Expected: FAIL because `NewLiveRepository`, live domain types, and methods are not defined.

- [ ] **Step 3: Add domain models**

Append these definitions to `private-domain-operation/backend/internal/domain/models.go`:

```go
type LiveListFilter struct {
	Status string
}

type LiveEvent struct {
	ID              int64  `json:"numericId"`
	PublicID        string `json:"id"`
	MerchantID      int64  `json:"merchantId"`
	Title           string `json:"title"`
	Summary         string `json:"summary"`
	Speaker         string `json:"speaker"`
	CoverURL        string `json:"coverUrl"`
	CoverHint       string `json:"coverHint"`
	StartAt         string `json:"startAt"`
	EndAt           string `json:"endAt"`
	Schedule        string `json:"schedule"`
	Duration        string `json:"duration"`
	Status          string `json:"status"`
	StatusOverride  string `json:"statusOverride"`
	EffectiveStatus string `json:"effectiveStatus"`
	StatusLabel     string `json:"statusLabel"`
	LiveURL         string `json:"-"`
	ReplayURL       string `json:"-"`
	Visibility      string `json:"visibility"`
	VisibilityRefID int64  `json:"visibilityRefId"`
	Audience        string `json:"audience"`
	ReplayEnabled   bool   `json:"replayEnabled"`
	ActionText      string `json:"actionText"`
	Theme           string `json:"theme"`
	Entry           any    `json:"entry,omitempty"`
	UpdatedAt       string `json:"updatedAt"`
}

type LiveDetail struct {
	LiveEvent
	Intro         string              `json:"intro"`
	Viewers       string              `json:"viewers"`
	AccessRules   []string            `json:"accessRules"`
	Highlights    []string            `json:"highlights"`
	ReplaySupport []string            `json:"replaySupport"`
	ReplayMoments []LiveReplayMoment  `json:"replayMoments"`
	TeacherBio    string              `json:"teacherBio"`
	RequiredAccess LiveRequiredAccess `json:"requiredAccess"`
}

type LiveReplayMoment struct {
	Range string `json:"range"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

type LiveRequiredAccess struct {
	Type  string `json:"type"`
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Entry any    `json:"entry,omitempty"`
}

type LiveEditPayload struct {
	ID              int64  `json:"id"`
	Title           string `json:"title"`
	Summary         string `json:"summary"`
	Speaker         string `json:"speaker"`
	CoverURL        string `json:"coverUrl"`
	StartAt         string `json:"startAt"`
	EndAt           string `json:"endAt"`
	StatusOverride  string `json:"statusOverride"`
	LiveURL         string `json:"liveUrl"`
	ReplayURL       string `json:"replayUrl"`
	Visibility      string `json:"visibility"`
	VisibilityRefID int64  `json:"visibilityRefId"`
	ReplayEnabled   bool   `json:"replayEnabled"`
}

type LiveAccessOption struct {
	Type  string `json:"type"`
	ID    int64  `json:"id"`
	Title string `json:"title"`
}

type LiveAccessOptions struct {
	Courses   []LiveAccessOption `json:"courses"`
	Bootcamps []LiveAccessOption `json:"bootcamps"`
	Members   []LiveAccessOption `json:"members"`
}

type LiveAccessDecision struct {
	Allowed        bool               `json:"allowed"`
	Mode           string             `json:"mode,omitempty"`
	TargetURL      string             `json:"targetUrl,omitempty"`
	OpenMethod     string             `json:"openMethod,omitempty"`
	FallbackAction string             `json:"fallbackAction,omitempty"`
	Reason         string             `json:"reason,omitempty"`
	RequiredAccess LiveRequiredAccess `json:"requiredAccess,omitempty"`
}
```

- [ ] **Step 4: Implement repository**

Create `private-domain-operation/backend/internal/repository/live_repository.go` with these public methods and private scanners:

```go
package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"private-domain-operation/backend/internal/domain"
)

type LiveRepository struct {
	db *sql.DB
}

func NewLiveRepository(db *sql.DB) *LiveRepository {
	return &LiveRepository{db: db}
}

func (r *LiveRepository) ListLiveEvents(ctx context.Context, _ domain.LiveListFilter) ([]domain.LiveEvent, error) {
	query := `
		SELECT id, merchant_id, title, summary, speaker, cover_url,
			COALESCE(start_at, ''), COALESCE(end_at, ''), status, status_override,
			live_url, replay_url, visibility, COALESCE(visibility_ref_id, 0),
			replay_enabled, updated_at
		FROM live_events
	`
	args := []any{}
	query += " ORDER BY COALESCE(start_at, ''), id"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.LiveEvent, 0)
	for rows.Next() {
		item, err := scanLiveEvent(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *LiveRepository) GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, merchant_id, title, summary, speaker, cover_url,
			COALESCE(start_at, ''), COALESCE(end_at, ''), status, status_override,
			live_url, replay_url, visibility, COALESCE(visibility_ref_id, 0),
			replay_enabled, updated_at
		FROM live_events
		WHERE id = ?
	`, liveID)
	event, err := scanLiveEvent(row)
	if err != nil {
		return domain.LiveDetail{}, err
	}
	return domain.LiveDetail{
		LiveEvent: event,
		Intro:     event.Summary,
		Viewers:   "观看权限以当前账号为准",
		AccessRules: []string{
			visibilityRuleText(event.Visibility),
			"进入直播或回放前会校验当前账号权限",
			"直播结束后按配置开放回放链接",
		},
		Highlights: []string{
			"直播围绕课程学习和私域运营问题展开",
			"支持商家配置观看范围",
			"回放链接由商家维护",
		},
		ReplaySupport: []string{"回放开放后可按链接观看", "未配置回放时显示准备中"},
		ReplayMoments: []domain.LiveReplayMoment{},
		TeacherBio:    event.Speaker + " 长期聚焦个人 IP、知识产品和私域运营实践。",
		RequiredAccess: domain.LiveRequiredAccess{
			Type:  event.Visibility,
			ID:    event.VisibilityRefID,
			Title: visibilityTitle(event.Visibility),
		},
	}, nil
}

func (r *LiveRepository) GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error) {
	detail, err := r.GetLiveDetail(ctx, liveID)
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	return editPayloadFromEvent(detail.LiveEvent), nil
}

func (r *LiveRepository) CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO live_events (
			merchant_id, title, summary, speaker, cover_url, start_at, end_at,
			status, status_override, live_url, replay_url, visibility, visibility_ref_id,
			replay_enabled
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULLIF(?, 0), ?)
	`, merchantID, payload.Title, payload.Summary, payload.Speaker, payload.CoverURL,
		payload.StartAt, payload.EndAt, "upcoming", payload.StatusOverride, payload.LiveURL,
		payload.ReplayURL, payload.Visibility, payload.VisibilityRefID, boolToInt(payload.ReplayEnabled))
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	return r.GetLiveEdit(ctx, id)
}

func (r *LiveRepository) UpdateLiveEvent(ctx context.Context, liveID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	result, err := r.db.ExecContext(ctx, `
		UPDATE live_events
		SET title = ?, summary = ?, speaker = ?, cover_url = ?, start_at = ?, end_at = ?,
			status_override = ?, live_url = ?, replay_url = ?, visibility = ?,
			visibility_ref_id = NULLIF(?, 0), replay_enabled = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, payload.Title, payload.Summary, payload.Speaker, payload.CoverURL, payload.StartAt,
		payload.EndAt, payload.StatusOverride, payload.LiveURL, payload.ReplayURL,
		payload.Visibility, payload.VisibilityRefID, boolToInt(payload.ReplayEnabled), liveID)
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	if affected == 0 {
		return domain.LiveEditPayload{}, sql.ErrNoRows
	}
	return r.GetLiveEdit(ctx, liveID)
}

func (r *LiveRepository) HasActiveGrant(ctx context.Context, userID int64, accessType string, accessRefID int64) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM content_access_grants
		WHERE user_id = ?
			AND access_type = ?
			AND access_ref_id = ?
			AND status = 'active'
			AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
			AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
	`, userID, accessType, accessRefID).Scan(&count)
	return count > 0, err
}

func (r *LiveRepository) GetAccessOptions(ctx context.Context) (domain.LiveAccessOptions, error) {
	courses, err := r.queryAccessOptions(ctx, "course", "SELECT id, title FROM courses ORDER BY id")
	if err != nil {
		return domain.LiveAccessOptions{}, err
	}
	bootcamps, err := r.queryAccessOptions(ctx, "bootcamp", "SELECT id, title FROM bootcamps ORDER BY id")
	if err != nil {
		return domain.LiveAccessOptions{}, err
	}
	members := []domain.LiveAccessOption{{Type: "member", ID: 1, Title: "年度会员计划"}}
	return domain.LiveAccessOptions{Courses: courses, Bootcamps: bootcamps, Members: members}, nil
}

func (r *LiveRepository) queryAccessOptions(ctx context.Context, optionType string, query string) ([]domain.LiveAccessOption, error) {
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.LiveAccessOption, 0)
	for rows.Next() {
		item := domain.LiveAccessOption{Type: optionType}
		if err := rows.Scan(&item.ID, &item.Title); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

type liveEventScanner interface {
	Scan(dest ...any) error
}

func scanLiveEvent(scanner liveEventScanner) (domain.LiveEvent, error) {
	var event domain.LiveEvent
	var replayEnabled int
	err := scanner.Scan(
		&event.ID, &event.MerchantID, &event.Title, &event.Summary, &event.Speaker,
		&event.CoverURL, &event.StartAt, &event.EndAt, &event.Status, &event.StatusOverride,
		&event.LiveURL, &event.ReplayURL, &event.Visibility, &event.VisibilityRefID,
		&replayEnabled, &event.UpdatedAt,
	)
	if err != nil {
		return domain.LiveEvent{}, err
	}
	event.PublicID = fmt.Sprintf("%d", event.ID)
	event.ReplayEnabled = replayEnabled == 1
	event.CoverHint = event.Summary
	event.Audience = visibilityRuleText(event.Visibility)
	event.Theme = liveTheme(event.ID)
	return event, nil
}

func editPayloadFromEvent(event domain.LiveEvent) domain.LiveEditPayload {
	return domain.LiveEditPayload{
		ID: event.ID, Title: event.Title, Summary: event.Summary, Speaker: event.Speaker,
		CoverURL: event.CoverURL, StartAt: event.StartAt, EndAt: event.EndAt,
		StatusOverride: event.StatusOverride, LiveURL: event.LiveURL, ReplayURL: event.ReplayURL,
		Visibility: event.Visibility, VisibilityRefID: event.VisibilityRefID,
		ReplayEnabled: event.ReplayEnabled,
	}
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func liveTheme(id int64) string {
	themes := []string{"purple", "blue", "indigo"}
	return themes[int(id-1)%len(themes)]
}

func visibilityRuleText(value string) string {
	switch strings.TrimSpace(value) {
	case "course":
		return "指定课程学员可观看"
	case "bootcamp":
		return "指定训练营成员可观看"
	case "member":
		return "指定会员计划用户可观看"
	default:
		return "登录用户可观看"
	}
}

func visibilityTitle(value string) string {
	switch strings.TrimSpace(value) {
	case "course":
		return "指定课程"
	case "bootcamp":
		return "指定训练营"
	case "member":
		return "会员计划"
	default:
		return "全部用户"
	}
}
```

- [ ] **Step 5: Run repository tests**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/repository -run LiveRepository -count=1
```

Expected: PASS.

- [ ] **Step 6: Commit repository work**

Run:

```bash
git add private-domain-operation/backend/internal/domain/models.go private-domain-operation/backend/internal/repository/live_repository.go private-domain-operation/backend/internal/repository/live_repository_test.go
git commit -m "feat: add live repository"
```

Expected: commit created.

---

### Task 3: Add Live Service Validation, Status, And Access Decisions

**Files:**
- Create: `private-domain-operation/backend/internal/service/live_service.go`
- Create: `private-domain-operation/backend/internal/service/live_service_test.go`

- [ ] **Step 1: Write failing service tests**

Create `private-domain-operation/backend/internal/service/live_service_test.go`:

```go
package service

import (
	"context"
	"errors"
	"testing"

	"private-domain-operation/backend/internal/domain"
)

func TestValidateLiveEditRejectsInvalidPayloads(t *testing.T) {
	t.Parallel()

	valid := domain.LiveEditPayload{
		Title: "直播标题", Summary: "直播简介", Speaker: "Gerry",
		CoverURL: "https://media.example.com/covers/live.jpg",
		StartAt: "2026-06-25T20:00:00+08:00", EndAt: "2026-06-25T21:00:00+08:00",
		StatusOverride: "", LiveURL: "https://media.example.com/live.m3u8",
		ReplayURL: "https://media.example.com/replay.mp4", Visibility: "course",
		VisibilityRefID: 1, ReplayEnabled: true,
	}

	tests := []struct {
		name   string
		mutate func(*domain.LiveEditPayload)
	}{
		{name: "missing title", mutate: func(payload *domain.LiveEditPayload) { payload.Title = " " }},
		{name: "bad start time", mutate: func(payload *domain.LiveEditPayload) { payload.StartAt = "bad-time" }},
		{name: "end before start", mutate: func(payload *domain.LiveEditPayload) { payload.EndAt = "2026-06-25T19:59:00+08:00" }},
		{name: "bad status", mutate: func(payload *domain.LiveEditPayload) { payload.StatusOverride = "paused" }},
		{name: "http live url", mutate: func(payload *domain.LiveEditPayload) { payload.LiveURL = "http://media.example.com/live.m3u8" }},
		{name: "http replay url", mutate: func(payload *domain.LiveEditPayload) { payload.ReplayURL = "http://media.example.com/replay.mp4" }},
		{name: "bad visibility", mutate: func(payload *domain.LiveEditPayload) { payload.Visibility = "vip" }},
		{name: "course without ref", mutate: func(payload *domain.LiveEditPayload) { payload.Visibility = "course"; payload.VisibilityRefID = 0 }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := valid
			tt.mutate(&payload)
			err := validateLiveEdit(payload)
			if !errors.Is(err, ErrLiveValidation) {
				t.Fatalf("validateLiveEdit error = %v, want ErrLiveValidation", err)
			}
		})
	}
}

func TestEffectiveLiveStatus(t *testing.T) {
	t.Parallel()

	now := mustParseLiveTime(t, "2026-06-25T20:30:00+08:00")
	event := domain.LiveEvent{
		StartAt: "2026-06-25T20:00:00+08:00",
		EndAt: "2026-06-25T21:00:00+08:00",
		LiveURL: "https://media.example.com/live.m3u8",
		ReplayURL: "https://media.example.com/replay.mp4",
		ReplayEnabled: true,
	}
	if got := effectiveLiveStatus(event, now); got != "live" {
		t.Fatalf("status = %q, want live", got)
	}

	event.StatusOverride = "replay"
	if got := effectiveLiveStatus(event, now); got != "replay" {
		t.Fatalf("override status = %q, want replay", got)
	}
}

func TestLiveAccessDecisionUsesGrants(t *testing.T) {
	t.Parallel()

	store := &fakeLiveStore{
		detail: domain.LiveDetail{LiveEvent: domain.LiveEvent{
			ID: 1, Title: "课程直播", Visibility: "course", VisibilityRefID: 1,
			StatusOverride: "live", LiveURL: "https://media.example.com/live.m3u8",
		}},
		grantAllowed: true,
	}
	svc := NewLiveService(store)
	decision, err := svc.CheckAccess(context.Background(), 2, 1, "live")
	if err != nil {
		t.Fatalf("CheckAccess returned error: %v", err)
	}
	if !decision.Allowed || decision.TargetURL != "https://media.example.com/live.m3u8" {
		t.Fatalf("decision = %#v", decision)
	}

	store.grantAllowed = false
	decision, err = svc.CheckAccess(context.Background(), 3, 1, "live")
	if err != nil {
		t.Fatalf("CheckAccess denied returned error: %v", err)
	}
	if decision.Allowed || decision.Reason == "" || decision.RequiredAccess.Type != "course" {
		t.Fatalf("denied decision = %#v", decision)
	}
}

type fakeLiveStore struct {
	detail       domain.LiveDetail
	grantAllowed bool
}

func (s *fakeLiveStore) ListLiveEvents(context.Context, domain.LiveListFilter) ([]domain.LiveEvent, error) {
	return []domain.LiveEvent{s.detail.LiveEvent}, nil
}
func (s *fakeLiveStore) GetLiveDetail(context.Context, int64) (domain.LiveDetail, error) {
	return s.detail, nil
}
func (s *fakeLiveStore) GetLiveEdit(context.Context, int64) (domain.LiveEditPayload, error) {
	return domain.LiveEditPayload{}, nil
}
func (s *fakeLiveStore) CreateLiveEvent(context.Context, int64, domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	return domain.LiveEditPayload{}, nil
}
func (s *fakeLiveStore) UpdateLiveEvent(context.Context, int64, domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	return domain.LiveEditPayload{}, nil
}
func (s *fakeLiveStore) HasActiveGrant(context.Context, int64, string, int64) (bool, error) {
	return s.grantAllowed, nil
}
func (s *fakeLiveStore) GetAccessOptions(context.Context) (domain.LiveAccessOptions, error) {
	return domain.LiveAccessOptions{}, nil
}
```

- [ ] **Step 2: Run service tests and confirm failure**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/service -run Live -count=1
```

Expected: FAIL because live service functions are not defined.

- [ ] **Step 3: Implement live service**

Create `private-domain-operation/backend/internal/service/live_service.go`:

```go
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"private-domain-operation/backend/internal/domain"
)

var (
	ErrLiveStoreRequired = errors.New("live store is required")
	ErrLiveValidation    = errors.New("live validation failed")
	ErrLiveAccessDenied  = errors.New("live access denied")
)

type LiveStore interface {
	ListLiveEvents(ctx context.Context, filter domain.LiveListFilter) ([]domain.LiveEvent, error)
	GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error)
	GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error)
	CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error)
	UpdateLiveEvent(ctx context.Context, liveID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error)
	HasActiveGrant(ctx context.Context, userID int64, accessType string, accessRefID int64) (bool, error)
	GetAccessOptions(ctx context.Context) (domain.LiveAccessOptions, error)
}

type LiveService struct {
	lives LiveStore
	now   func() time.Time
}

func NewLiveService(lives LiveStore) *LiveService {
	return &LiveService{lives: lives, now: time.Now}
}

func (s *LiveService) ListLiveEvents(ctx context.Context, status string) ([]domain.LiveEvent, error) {
	if s.lives == nil {
		return nil, ErrLiveStoreRequired
	}
	items, err := s.lives.ListLiveEvents(ctx, domain.LiveListFilter{Status: normalizeLiveStatusFilter(status)})
	if err != nil {
		return nil, err
	}
	for i := range items {
		decorateLiveEvent(&items[i], s.now())
	}
	filtered := make([]domain.LiveEvent, 0, len(items))
	for _, item := range items {
		if status == "" || status == "all" || item.EffectiveStatus == status || item.Status == status {
			filtered = append(filtered, item)
		}
	}
	return filtered, nil
}

func (s *LiveService) GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error) {
	if s.lives == nil {
		return domain.LiveDetail{}, ErrLiveStoreRequired
	}
	detail, err := s.lives.GetLiveDetail(ctx, liveID)
	if err != nil {
		return domain.LiveDetail{}, err
	}
	decorateLiveEvent(&detail.LiveEvent, s.now())
	return detail, nil
}

func (s *LiveService) GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error) {
	if s.lives == nil {
		return domain.LiveEditPayload{}, ErrLiveStoreRequired
	}
	return s.lives.GetLiveEdit(ctx, liveID)
}

func (s *LiveService) CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	if s.lives == nil {
		return domain.LiveEditPayload{}, ErrLiveStoreRequired
	}
	if err := validateLiveEdit(payload); err != nil {
		return domain.LiveEditPayload{}, err
	}
	return s.lives.CreateLiveEvent(ctx, merchantID, payload)
}

func (s *LiveService) UpdateLiveEvent(ctx context.Context, liveID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	if s.lives == nil {
		return domain.LiveEditPayload{}, ErrLiveStoreRequired
	}
	if err := validateLiveEdit(payload); err != nil {
		return domain.LiveEditPayload{}, err
	}
	return s.lives.UpdateLiveEvent(ctx, liveID, payload)
}

func (s *LiveService) GetAccessOptions(ctx context.Context) (domain.LiveAccessOptions, error) {
	if s.lives == nil {
		return domain.LiveAccessOptions{}, ErrLiveStoreRequired
	}
	return s.lives.GetAccessOptions(ctx)
}

func (s *LiveService) CheckAccess(ctx context.Context, userID int64, liveID int64, mode string) (domain.LiveAccessDecision, error) {
	if s.lives == nil {
		return domain.LiveAccessDecision{}, ErrLiveStoreRequired
	}
	detail, err := s.GetLiveDetail(ctx, liveID)
	if err != nil {
		return domain.LiveAccessDecision{}, err
	}
	mode = normalizeLiveMode(mode, detail.EffectiveStatus)
	if !isAllowedMode(mode, detail.EffectiveStatus) {
		return domain.LiveAccessDecision{Allowed: false, Reason: "当前直播状态不可进入"}, nil
	}
	if detail.Visibility != "all" {
		allowed, err := s.lives.HasActiveGrant(ctx, userID, detail.Visibility, detail.VisibilityRefID)
		if err != nil {
			return domain.LiveAccessDecision{}, err
		}
		if !allowed {
			return domain.LiveAccessDecision{
				Allowed: false,
				Reason:  accessDeniedReason(detail.Visibility),
				RequiredAccess: domain.LiveRequiredAccess{
					Type: detail.Visibility, ID: detail.VisibilityRefID, Title: visibilityTitleForService(detail.Visibility),
				},
			}, nil
		}
	}
	target := detail.LiveURL
	if mode == "replay" {
		target = detail.ReplayURL
	}
	if strings.TrimSpace(target) == "" {
		return domain.LiveAccessDecision{Allowed: false, Reason: "直播链接暂未配置"}, nil
	}
	return domain.LiveAccessDecision{
		Allowed: true, Mode: mode, TargetURL: target, OpenMethod: "web_view", FallbackAction: "copy_link",
	}, nil
}

func validateLiveEdit(payload domain.LiveEditPayload) error {
	if strings.TrimSpace(payload.Title) == "" {
		return fmt.Errorf("%w: live title is required", ErrLiveValidation)
	}
	start, err := parseLiveTime(payload.StartAt)
	if err != nil {
		return fmt.Errorf("%w: start time is invalid", ErrLiveValidation)
	}
	end, err := parseLiveTime(payload.EndAt)
	if err != nil {
		return fmt.Errorf("%w: end time is invalid", ErrLiveValidation)
	}
	if !end.After(start) {
		return fmt.Errorf("%w: end time must be after start time", ErrLiveValidation)
	}
	if !validLiveStatusOverride(payload.StatusOverride) {
		return fmt.Errorf("%w: status override is invalid", ErrLiveValidation)
	}
	if payload.CoverURL != "" && !strings.HasPrefix(payload.CoverURL, "https://") {
		return fmt.Errorf("%w: cover url must use https", ErrLiveValidation)
	}
	if payload.LiveURL != "" && !strings.HasPrefix(payload.LiveURL, "https://") {
		return fmt.Errorf("%w: live url must use https", ErrLiveValidation)
	}
	if payload.ReplayURL != "" && !strings.HasPrefix(payload.ReplayURL, "https://") {
		return fmt.Errorf("%w: replay url must use https", ErrLiveValidation)
	}
	if !validVisibility(payload.Visibility) {
		return fmt.Errorf("%w: visibility is invalid", ErrLiveValidation)
	}
	if payload.Visibility != "all" && payload.VisibilityRefID <= 0 {
		return fmt.Errorf("%w: visibility ref id is required", ErrLiveValidation)
	}
	return nil
}

func decorateLiveEvent(event *domain.LiveEvent, now time.Time) {
	event.EffectiveStatus = effectiveLiveStatus(*event, now)
	event.Status = event.EffectiveStatus
	event.StatusLabel = liveStatusLabelForService(event.EffectiveStatus)
	event.Schedule = liveScheduleText(event.StartAt, event.EndAt, event.EffectiveStatus)
	event.Duration = liveDurationText(event.StartAt, event.EndAt)
	event.ActionText = liveActionText(event.EffectiveStatus)
}

func effectiveLiveStatus(event domain.LiveEvent, now time.Time) string {
	if validLiveStatusOverride(event.StatusOverride) && event.StatusOverride != "" {
		return event.StatusOverride
	}
	start, startErr := parseLiveTime(event.StartAt)
	end, endErr := parseLiveTime(event.EndAt)
	if startErr == nil && now.Before(start) {
		return "upcoming"
	}
	if startErr == nil && endErr == nil && !now.Before(start) && !now.After(end) {
		return "live"
	}
	if endErr == nil && now.After(end) && event.ReplayEnabled && strings.TrimSpace(event.ReplayURL) != "" {
		return "replay"
	}
	return "ended"
}

func parseLiveTime(value string) (time.Time, error) {
	return time.Parse(time.RFC3339, strings.TrimSpace(value))
}

func mustParseLiveTime(t interface{ Fatalf(string, ...any) }, value string) time.Time {
	parsed, err := parseLiveTime(value)
	if err != nil {
		t.Fatalf("parse live time %q failed: %v", value, err)
	}
	return parsed
}
```

Add helper functions in the same file:

```go
func normalizeLiveStatusFilter(status string) string {
	status = strings.TrimSpace(status)
	switch status {
	case "upcoming", "live", "ended", "replay":
		return status
	default:
		return "all"
	}
}

func normalizeLiveMode(mode string, effectiveStatus string) string {
	mode = strings.TrimSpace(mode)
	if mode == "replay" {
		return "replay"
	}
	if mode == "live" {
		return "live"
	}
	if effectiveStatus == "replay" {
		return "replay"
	}
	return "live"
}

func isAllowedMode(mode string, effectiveStatus string) bool {
	if mode == "live" {
		return effectiveStatus == "live"
	}
	if mode == "replay" {
		return effectiveStatus == "replay"
	}
	return false
}

func validLiveStatusOverride(status string) bool {
	switch strings.TrimSpace(status) {
	case "", "upcoming", "live", "ended", "replay":
		return true
	default:
		return false
	}
}

func validVisibility(value string) bool {
	switch strings.TrimSpace(value) {
	case "all", "course", "bootcamp", "member":
		return true
	default:
		return false
	}
}

func liveStatusLabelForService(status string) string {
	switch status {
	case "live":
		return "直播中"
	case "replay":
		return "回放"
	case "ended":
		return "已结束"
	default:
		return "未开始"
	}
}

func liveActionText(status string) string {
	switch status {
	case "live":
		return "进入直播间"
	case "replay":
		return "观看回放"
	case "ended":
		return "回放准备中"
	default:
		return "查看详情"
	}
}

func liveScheduleText(startAt string, endAt string, status string) string {
	if status == "live" {
		return "正在直播中"
	}
	if status == "replay" {
		return "回放已开放"
	}
	start, err := parseLiveTime(startAt)
	if err != nil {
		return ""
	}
	end, err := parseLiveTime(endAt)
	if err != nil {
		return start.Format("01-02 15:04")
	}
	return start.Format("01-02 15:04") + " - " + end.Format("15:04")
}

func liveDurationText(startAt string, endAt string) string {
	start, startErr := parseLiveTime(startAt)
	end, endErr := parseLiveTime(endAt)
	if startErr != nil || endErr != nil || !end.After(start) {
		return ""
	}
	minutes := int(end.Sub(start).Minutes())
	return fmt.Sprintf("预计 %d 分钟", minutes)
}

func accessDeniedReason(value string) string {
	switch value {
	case "course":
		return "需要购买指定课程后观看"
	case "bootcamp":
		return "需要加入指定训练营后观看"
	case "member":
		return "需要开通指定会员计划后观看"
	default:
		return "当前账号暂无观看权限"
	}
}

func visibilityTitleForService(value string) string {
	switch value {
	case "course":
		return "指定课程"
	case "bootcamp":
		return "指定训练营"
	case "member":
		return "会员计划"
	default:
		return "全部用户"
	}
}
```

- [ ] **Step 4: Run service tests**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/service -run Live -count=1
```

Expected: PASS.

- [ ] **Step 5: Commit service work**

Run:

```bash
git add private-domain-operation/backend/internal/service/live_service.go private-domain-operation/backend/internal/service/live_service_test.go
git commit -m "feat: add live access service"
```

Expected: commit created.

---

### Task 4: Add Live API Handlers And Wire Backend

**Files:**
- Create: `private-domain-operation/backend/internal/handler/live.go`
- Modify: `private-domain-operation/backend/internal/handler/auth.go`
- Modify: `private-domain-operation/backend/internal/handler/router.go`
- Modify: `private-domain-operation/backend/internal/handler/page_data.go`
- Modify: `private-domain-operation/backend/internal/handler/router_test.go`
- Modify: `private-domain-operation/backend/cmd/api/main.go`

- [ ] **Step 1: Write failing route tests**

Append these tests to `private-domain-operation/backend/internal/handler/router_test.go`:

```go
func TestLiveAPIsUseSQLiteAndAccessChecks(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/live-events?status=all", nil)
	listResp := httptest.NewRecorder()
	router.ServeHTTP(listResp, listReq)
	if listResp.Code != http.StatusOK {
		t.Fatalf("list status = %d body = %s", listResp.Code, listResp.Body.String())
	}
	if !strings.Contains(listResp.Body.String(), "私域运营直播答疑") {
		t.Fatalf("list body missing seed live: %s", listResp.Body.String())
	}

	token := testStudentToken(t)
	accessReq := httptest.NewRequest(http.MethodPost, "/api/v1/live-events/2/access-check", strings.NewReader(`{"mode":"live"}`))
	accessReq.Header.Set("Authorization", "Bearer "+token)
	accessReq.Header.Set("Content-Type", "application/json")
	accessResp := httptest.NewRecorder()
	router.ServeHTTP(accessResp, accessReq)
	if accessResp.Code != http.StatusOK {
		t.Fatalf("access status = %d body = %s", accessResp.Code, accessResp.Body.String())
	}
	if !strings.Contains(accessResp.Body.String(), `"allowed":true`) {
		t.Fatalf("access body = %s", accessResp.Body.String())
	}
	if !strings.Contains(accessResp.Body.String(), "https://media.example.com/live/content-clinic.m3u8") {
		t.Fatalf("access target missing: %s", accessResp.Body.String())
	}
}

func TestLiveAccessCheckRequiresLogin(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/live-events/1/access-check", strings.NewReader(`{"mode":"live"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assertErrorCode(t, resp, http.StatusUnauthorized, 40101)
}

func TestMerchantLiveCreateEditAndValidation(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testMerchantToken(t)
	createBody := `{
		"title":"新增直播",
		"summary":"新增直播简介",
		"speaker":"Gerry",
		"coverUrl":"https://media.example.com/covers/live/new.jpg",
		"startAt":"2026-06-27T20:00:00+08:00",
		"endAt":"2026-06-27T21:00:00+08:00",
		"statusOverride":"upcoming",
		"liveUrl":"https://media.example.com/live/new.m3u8",
		"replayUrl":"",
		"visibility":"all",
		"visibilityRefId":0,
		"replayEnabled":false
	}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/merchant/live-events", strings.NewReader(createBody))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createReq.Header.Set("Content-Type", "application/json")
	createResp := httptest.NewRecorder()
	router.ServeHTTP(createResp, createReq)
	if createResp.Code != http.StatusOK {
		t.Fatalf("create status = %d body = %s", createResp.Code, createResp.Body.String())
	}

	var created struct {
		Data struct {
			ID int64 `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(createResp.Body.Bytes(), &created); err != nil {
		t.Fatalf("create JSON decode failed: %v body = %s", err, createResp.Body.String())
	}
	if created.Data.ID == 0 {
		t.Fatalf("created id = 0")
	}

	invalidReq := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/merchant/live-events/%d", created.Data.ID), strings.NewReader(strings.Replace(createBody, "https://media.example.com/live/new.m3u8", "http://media.example.com/live/new.m3u8", 1)))
	invalidReq.Header.Set("Authorization", "Bearer "+token)
	invalidReq.Header.Set("Content-Type", "application/json")
	invalidResp := httptest.NewRecorder()
	router.ServeHTTP(invalidResp, invalidReq)
	assertErrorCode(t, invalidResp, http.StatusBadRequest, 40004)
}
```

Add `fmt` to `router_test.go` imports.

- [ ] **Step 2: Run route tests and confirm failure**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/handler -run 'Live|MerchantLive' -count=1
```

Expected: FAIL because live handlers still use static functions and no access-check/create/update routes exist.

- [ ] **Step 3: Wire dependency types and server startup**

Modify `private-domain-operation/backend/internal/handler/auth.go`:

```go
type Dependencies struct {
	Auth     *service.AuthService
	Courses  *service.CourseService
	Progress *service.ProgressService
	Live     *service.LiveService
}
```

Modify `private-domain-operation/backend/cmd/api/main.go`:

```go
	lives := repository.NewLiveRepository(conn)

	router := handler.NewRouterWithDependencies(handler.Dependencies{
		Auth:     authService,
		Courses:  service.NewCourseService(courses),
		Progress: service.NewProgressService(progress),
		Live:     service.NewLiveService(lives),
	})
```

Modify the `testRouter` helper in `private-domain-operation/backend/internal/handler/router_test.go` to include:

```go
	lives := repository.NewLiveRepository(conn)
	deps := Dependencies{
		Auth:     authService,
		Courses:  service.NewCourseService(courses),
		Progress: service.NewProgressService(progress),
		Live:     service.NewLiveService(lives),
	}
```

- [ ] **Step 4: Update router live routes**

Modify `private-domain-operation/backend/internal/handler/router.go`:

```go
		api.GET("/live-events", handleLiveList(deps))
		api.GET("/live-events/:live_id", handleLiveDetail(deps))
		api.GET("/live-events/:live_id/room", handleLiveRoom(deps))
		api.POST("/live-events/:live_id/access-check", requireAuthMiddleware(deps), handleLiveAccessCheck(deps))
```

Modify merchant routes:

```go
			merchant.GET("/live-events", handleMerchantLiveEvents(deps))
			merchant.POST("/live-events", handleMerchantLiveCreate(deps))
			merchant.GET("/live-events/:live_id/edit", handleMerchantLiveEdit(deps))
			merchant.PUT("/live-events/:live_id", handleMerchantLiveUpdate(deps))
			merchant.GET("/access-options", handleMerchantAccessOptions(deps))
```

- [ ] **Step 5: Create handler implementation**

Create `private-domain-operation/backend/internal/handler/live.go`:

```go
package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/service"
)

type liveAccessRequest struct {
	Mode string `json:"mode"`
}

func handleLiveList(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		if deps.Live == nil {
			errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
			return
		}
		status := c.DefaultQuery("status", "all")
		items, err := deps.Live.ListLiveEvents(c.Request.Context(), status)
		if err != nil {
			errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
			return
		}
		for i := range items {
			items[i].Entry = pageEntry("/pages/live-detail/live-detail?liveId=" + items[i].PublicID + "&mode=" + items[i].EffectiveStatus)
		}
		ok(c, gin.H{
			"navSubtitle": "查看即将开始、直播中与回放内容",
			"filterTabs": []gin.H{{"key": "all", "label": "全部"}, {"key": "upcoming", "label": "即将开始"}, {"key": "live", "label": "直播中"}, {"key": "replay", "label": "回放"}},
			"activeTab": status,
			"emptyHint": "当前暂无符合筛选条件的直播",
			"liveList": items,
		})
	}
}

func handleLiveDetail(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		liveID, okID := parseLiveIDParam(c)
		if !okID {
			return
		}
		mode := c.DefaultQuery("mode", "upcoming")
		detail, err := deps.Live.GetLiveDetail(c.Request.Context(), liveID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}
		mode = resolveLiveModeForHandler(mode, detail.EffectiveStatus)
		roomMode := "live"
		if mode == "replay" {
			roomMode = "replay"
		}
		ok(c, gin.H{
			"live": detail, "mode": mode, "isReplay": mode == "replay",
			"statusText": detail.StatusLabel,
			"navSubtitle": "观看条件与直播看点",
			"statusPanelTitle": "直播状态",
			"statusPanelTag": detail.Audience,
			"statusPanelSummary": "进入直播或回放前会校验当前账号权限。",
			"statusPanelItems": detail.AccessRules,
			"sectionHighlightTitle": "本场看点",
			"primaryActionText": detail.ActionText,
			"secondaryActionText": "咨询直播",
			"posterActionText": "保存海报",
			"posterSavingText": "保存中",
			"posterMessages": gin.H{"generatingTitle": "海报生成中", "savingTitle": "正在保存", "successTitle": "海报已保存", "failureTitle": "海报保存失败"},
			"primaryEntry": pageEntry("/pages/live-room/live-room?liveId=" + detail.PublicID + "&mode=" + roomMode + "&title=" + detail.Title),
			"secondaryEntry": pageEntry("/pages/consultation/consultation?scene=live&title=" + detail.Title),
		})
	}
}

func handleLiveRoom(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		liveID, okID := parseLiveIDParam(c)
		if !okID {
			return
		}
		detail, err := deps.Live.GetLiveDetail(c.Request.Context(), liveID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}
		mode := resolveLiveModeForHandler(c.DefaultQuery("mode", "live"), detail.EffectiveStatus)
		ok(c, gin.H{
			"liveId": detail.PublicID, "title": detail.Title, "mode": mode,
			"statusText": detail.StatusLabel, "statusTheme": detail.EffectiveStatus,
			"audienceText": detail.Audience, "topic": detail.Summary,
			"notice": "进入直播或回放前会校验当前账号权限。",
			"messages": []gin.H{},
			"replayProgress": "", "replaySummary": "", "replayHighlights": []string{},
			"inputPlaceholder": "互动能力暂未接入", "actionLabel": "校验观看权限",
			"accessPending": true,
		})
	}
}

func handleLiveAccessCheck(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		liveID, okID := parseLiveIDParam(c)
		if !okID {
			return
		}
		userID, okUser := currentDBUserID(c)
		if !okUser {
			return
		}
		var req liveAccessRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			errorJSON(c, http.StatusBadRequest, 40004, "invalid live access request")
			return
		}
		decision, err := deps.Live.CheckAccess(c.Request.Context(), userID, liveID, req.Mode)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}
		ok(c, decision)
	}
}
```

Add merchant handlers and helpers in the same file:

```go
func handleMerchantLiveEvents(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		items, err := deps.Live.ListLiveEvents(c.Request.Context(), c.DefaultQuery("status", "all"))
		if err != nil {
			errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
			return
		}
		ok(c, gin.H{
			"pageHint": "管理直播时间、链接、状态和观看范围。",
			"filterTabs": []gin.H{{"key": "all", "label": "全部"}, {"key": "upcoming", "label": "未开始"}, {"key": "live", "label": "直播中"}, {"key": "ended", "label": "已结束"}, {"key": "replay", "label": "回放"}},
			"activeTab": c.DefaultQuery("status", "all"),
			"createFeedback": "新建直播",
			"liveList": items,
		})
	}
}

func handleMerchantLiveCreate(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload domain.LiveEditPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			errorJSON(c, http.StatusBadRequest, 40004, "invalid live edit request")
			return
		}
		created, err := deps.Live.CreateLiveEvent(c.Request.Context(), 1, payload)
		if err != nil {
			writeLiveSaveError(c, err)
			return
		}
		ok(c, created)
	}
}

func handleMerchantLiveEdit(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		liveID, okID := parseLiveIDParam(c)
		if !okID {
			return
		}
		payload, err := deps.Live.GetLiveEdit(c.Request.Context(), liveID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}
		ok(c, payload)
	}
}

func handleMerchantLiveUpdate(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		liveID, okID := parseLiveIDParam(c)
		if !okID {
			return
		}
		var payload domain.LiveEditPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			errorJSON(c, http.StatusBadRequest, 40004, "invalid live edit request")
			return
		}
		updated, err := deps.Live.UpdateLiveEvent(c.Request.Context(), liveID, payload)
		if err != nil {
			writeLiveSaveError(c, err)
			return
		}
		ok(c, updated)
	}
}

func handleMerchantAccessOptions(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		options, err := deps.Live.GetAccessOptions(c.Request.Context())
		if err != nil {
			errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
			return
		}
		ok(c, options)
	}
}

func parseLiveIDParam(c *gin.Context) (int64, bool) {
	value := strings.TrimSpace(c.Param("live_id"))
	liveID, err := strconv.ParseInt(value, 10, 64)
	if err != nil || liveID <= 0 {
		errorJSON(c, http.StatusBadRequest, 40003, "invalid live id")
		return 0, false
	}
	return liveID, true
}

func writeLiveLoadError(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		errorJSON(c, http.StatusNotFound, 40404, "live not found")
		return
	}
	if errors.Is(err, service.ErrLiveStoreRequired) {
		errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
		return
	}
	errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
}

func writeLiveSaveError(c *gin.Context, err error) {
	if errors.Is(err, service.ErrLiveValidation) {
		errorJSON(c, http.StatusBadRequest, 40004, "invalid live edit params")
		return
	}
	writeLiveLoadError(c, err)
}

func resolveLiveModeForHandler(mode string, status string) string {
	if mode == "replay" || status == "replay" {
		return "replay"
	}
	return "live"
}
```

- [ ] **Step 6: Remove static live handler functions from page_data**

In `private-domain-operation/backend/internal/handler/page_data.go`, remove these functions to avoid duplicate names:

```text
handleLiveList
liveListItem
handleLiveDetail
liveDetail
handleLiveRoom
handleMerchantLiveEvents
liveStatusLabel
```

If `modeStatusText` is only used by removed live code, remove it as well.

- [ ] **Step 7: Run handler tests**

Run:

```bash
cd private-domain-operation/backend
go test ./internal/handler -run 'Live|MerchantLive' -count=1
```

Expected: PASS.

- [ ] **Step 8: Run full backend tests**

Run:

```bash
cd private-domain-operation/backend
go test ./...
```

Expected: PASS.

- [ ] **Step 9: Commit handler wiring**

Run:

```bash
git add private-domain-operation/backend/internal/handler/live.go private-domain-operation/backend/internal/handler/auth.go private-domain-operation/backend/internal/handler/router.go private-domain-operation/backend/internal/handler/page_data.go private-domain-operation/backend/internal/handler/router_test.go private-domain-operation/backend/cmd/api/main.go
git commit -m "feat: expose live management APIs"
```

Expected: commit created.

---

### Task 5: Add Frontend Live API Functions And Management Navigation

**Files:**
- Modify: `private-domain-operation/services/api/page-data.js`
- Modify: `private-domain-operation/utils/navigation.js`
- Modify: `private-domain-operation/pages/live-management/live-management.js`
- Modify: `private-domain-operation/pages/live-management/live-management.wxml`

- [ ] **Step 1: Add API functions**

In `private-domain-operation/services/api/page-data.js`, add these functions after `fetchLiveManagementPageData`:

```js
function fetchLiveEditPageData(liveId = "") {
  if (!liveId) {
    return Promise.resolve(null);
  }

  return apiRequest({
    path: `/api/v1/merchant/live-events/${liveId}/edit`,
    fallback: () => liveData.getLiveEditPageData(liveId)
  });
}

function fetchLiveAccessOptions() {
  return apiRequest({
    path: "/api/v1/merchant/access-options",
    fallback: () => liveData.getLiveAccessOptions()
  });
}

function createLiveEvent(payload = {}) {
  return apiRequest({
    path: "/api/v1/merchant/live-events",
    method: "POST",
    data: payload,
    fallback: () => liveData.saveLiveEdit("", payload)
  });
}

function saveLiveEvent(liveId = "", payload = {}) {
  return apiRequest({
    path: `/api/v1/merchant/live-events/${liveId}`,
    method: "PUT",
    data: payload,
    fallback: () => liveData.saveLiveEdit(liveId, payload)
  });
}

function checkLiveAccess(liveId = "", mode = "live") {
  return apiRequest({
    path: `/api/v1/live-events/${liveId}/access-check`,
    method: "POST",
    data: { mode },
    fallback: () => liveData.checkLiveAccess(liveId, mode)
  });
}
```

Export these functions in `module.exports`:

```js
  checkLiveAccess,
  createLiveEvent,
  fetchLiveAccessOptions,
  fetchLiveEditPageData,
  saveLiveEvent,
```

- [ ] **Step 2: Add navigation helpers**

In `private-domain-operation/utils/navigation.js`, change:

```js
const LIVE_MODE_KEYS = ["upcoming", "live", "replay"];
```

to:

```js
const LIVE_MODE_KEYS = ["upcoming", "live", "replay", "ended"];
```

Add helper functions after `toLiveRoom`:

```js
function toLiveEdit(liveId = "") {
  return buildPageUrl("/pages/live-edit/live-edit", {
    liveId: decodeValue(liveId)
  });
}

function toWebViewer(url = "", title = "") {
  return buildPageUrl("/pages/web-viewer/web-viewer", {
    url: decodeValue(url),
    title: decodeValue(title)
  });
}
```

Export them:

```js
  toLiveEdit,
  toWebViewer,
```

- [ ] **Step 3: Update live management page navigation**

Modify imports in `private-domain-operation/pages/live-management/live-management.js`:

```js
const { fetchLiveManagementPageData } = require("../../services/api/page-data");
const { openPageEntry, toLiveEdit } = require("../../utils/navigation");
```

Replace `onActionTap` and `onCreateTap`:

```js
  onActionTap(event) {
    const { liveId } = event.currentTarget.dataset;
    openPageEntry({
      url: toLiveEdit(liveId),
      method: "navigateTo"
    }, "编辑直播");
  },

  onCreateTap() {
    openPageEntry({
      url: toLiveEdit(""),
      method: "navigateTo"
    }, "新建直播");
  }
```

Modify action binding in `private-domain-operation/pages/live-management/live-management.wxml`:

```xml
<view class="live-card-action" data-live-id="{{item.id}}" bindtap="onActionTap">{{item.actionText || '编辑'}}</view>
```

- [ ] **Step 4: Add mock fallback functions**

In `private-domain-operation/mock/live-data.js`, add:

```js
function getLiveEditPageData(liveId = "") {
  const source = liveCatalog[liveId] || {};
  return {
    id: liveId,
    title: source.title || "",
    summary: source.intro || "",
    speaker: source.speaker || "Gerry",
    coverUrl: "",
    startAt: "2026-06-25T20:00:00+08:00",
    endAt: "2026-06-25T21:00:00+08:00",
    statusOverride: "",
    liveUrl: "https://media.example.com/live/private-domain-qa.m3u8",
    replayUrl: "https://media.example.com/replay/private-domain-qa.mp4",
    visibility: "course",
    visibilityRefId: 1,
    replayEnabled: true
  };
}

function getLiveAccessOptions() {
  return {
    courses: [{ type: "course", id: 1, title: "AIGC 视频制作" }],
    bootcamps: [{ type: "bootcamp", id: 1, title: "7 天私域增长训练营" }],
    members: [{ type: "member", id: 1, title: "年度会员计划" }]
  };
}

function saveLiveEdit(liveId = "", payload = {}) {
  return {
    ...payload,
    id: liveId || Date.now()
  };
}

function checkLiveAccess(liveId = "", mode = "live") {
  return {
    allowed: true,
    mode,
    targetUrl: mode === "replay"
      ? "https://media.example.com/replay/private-domain-qa.mp4"
      : "https://media.example.com/live/private-domain-qa.m3u8",
    openMethod: "web_view",
    fallbackAction: "copy_link"
  };
}
```

Add these names to `module.exports`.

- [ ] **Step 5: Validate changed JavaScript syntax**

Run:

```bash
node -c private-domain-operation/services/api/page-data.js
node -c private-domain-operation/utils/navigation.js
node -c private-domain-operation/pages/live-management/live-management.js
node -c private-domain-operation/mock/live-data.js
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit API and navigation work**

Run:

```bash
git add private-domain-operation/services/api/page-data.js private-domain-operation/utils/navigation.js private-domain-operation/pages/live-management/live-management.js private-domain-operation/pages/live-management/live-management.wxml private-domain-operation/mock/live-data.js
git commit -m "feat: add live frontend API entrypoints"
```

Expected: commit created.

---

### Task 6: Add Merchant Live Edit Page

**Files:**
- Modify: `private-domain-operation/app.json`
- Create: `private-domain-operation/pages/live-edit/live-edit.js`
- Create: `private-domain-operation/pages/live-edit/live-edit.wxml`
- Create: `private-domain-operation/pages/live-edit/live-edit.wxss`
- Create: `private-domain-operation/pages/live-edit/live-edit.json`

- [ ] **Step 1: Register page**

Add these entries in `private-domain-operation/app.json` after `pages/live-management/live-management`:

```json
    "pages/live-edit/live-edit",
    "pages/web-viewer/web-viewer",
```

`pages/web-viewer/web-viewer` is registered here so Task 7 only needs to create the files.

- [ ] **Step 2: Create live edit controller**

Create `private-domain-operation/pages/live-edit/live-edit.js`:

```js
const {
  createLiveEvent,
  fetchLiveAccessOptions,
  fetchLiveEditPageData,
  saveLiveEvent
} = require("../../services/api/page-data");

const STATUS_OPTIONS = [
  { key: "", label: "自动" },
  { key: "upcoming", label: "未开始" },
  { key: "live", label: "直播中" },
  { key: "ended", label: "已结束" },
  { key: "replay", label: "回放" }
];

const VISIBILITY_OPTIONS = [
  { key: "all", label: "全部用户" },
  { key: "course", label: "指定课程" },
  { key: "bootcamp", label: "指定训练营" },
  { key: "member", label: "指定会员" }
];

function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function defaultForm() {
  return {
    id: "",
    title: "",
    summary: "",
    speaker: "Gerry",
    coverUrl: "",
    startAt: "2026-06-25T20:00:00+08:00",
    endAt: "2026-06-25T21:00:00+08:00",
    statusOverride: "",
    liveUrl: "",
    replayUrl: "",
    visibility: "all",
    visibilityRefId: 0,
    replayEnabled: false
  };
}

function normalizeForm(payload = {}) {
  return {
    ...defaultForm(),
    ...(payload || {}),
    id: payload && payload.id ? String(payload.id) : "",
    visibilityRefId: Number(payload && payload.visibilityRefId) || 0,
    replayEnabled: Boolean(payload && payload.replayEnabled)
  };
}

function optionListForVisibility(options = {}, visibility = "all") {
  if (visibility === "course") {
    return options.courses || [];
  }
  if (visibility === "bootcamp") {
    return options.bootcamps || [];
  }
  if (visibility === "member") {
    return options.members || [];
  }
  return [];
}

function buildPayload(form = {}) {
  return {
    title: form.title || "",
    summary: form.summary || "",
    speaker: form.speaker || "",
    coverUrl: form.coverUrl || "",
    startAt: form.startAt || "",
    endAt: form.endAt || "",
    statusOverride: form.statusOverride || "",
    liveUrl: form.liveUrl || "",
    replayUrl: form.replayUrl || "",
    visibility: form.visibility || "all",
    visibilityRefId: Number(form.visibilityRefId) || 0,
    replayEnabled: Boolean(form.replayEnabled)
  };
}

function showToast(title, icon = "none") {
  wx.showToast({ title, icon });
}

Page({
  data: {
    liveId: "",
    loading: true,
    saving: false,
    statusOptions: STATUS_OPTIONS,
    visibilityOptions: VISIBILITY_OPTIONS,
    accessOptions: { courses: [], bootcamps: [], members: [] },
    refOptions: [],
    form: defaultForm()
  },

  async onLoad(options = {}) {
    const liveId = safeDecode(options.liveId);
    this.setData({ liveId, loading: true, form: defaultForm() });

    try {
      const [formPayload, accessOptions] = await Promise.all([
        liveId ? fetchLiveEditPageData(liveId) : Promise.resolve(defaultForm()),
        fetchLiveAccessOptions()
      ]);
      const form = normalizeForm(formPayload || defaultForm());
      this.setData({
        loading: false,
        accessOptions,
        form,
        refOptions: optionListForVisibility(accessOptions, form.visibility)
      });
    } catch (error) {
      this.setData({ loading: false });
      showToast((error && error.message) || "直播加载失败");
    }
  },

  onBackTap() {
    wx.navigateBack({ delta: 1 });
  },

  onFieldInput(event) {
    const { field } = event.currentTarget.dataset;
    if (!field) {
      return;
    }
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onStatusTap(event) {
    this.setData({ "form.statusOverride": event.currentTarget.dataset.status || "" });
  },

  onVisibilityTap(event) {
    const visibility = event.currentTarget.dataset.visibility || "all";
    this.setData({
      "form.visibility": visibility,
      "form.visibilityRefId": 0,
      refOptions: optionListForVisibility(this.data.accessOptions, visibility)
    });
  },

  onRefTap(event) {
    this.setData({ "form.visibilityRefId": Number(event.currentTarget.dataset.refId) || 0 });
  },

  onReplaySwitch(event) {
    this.setData({ "form.replayEnabled": Boolean(event.detail.value) });
  },

  async onSaveTap() {
    if (this.data.saving) {
      return;
    }
    this.setData({ saving: true });
    try {
      const payload = buildPayload(this.data.form);
      const saved = this.data.liveId
        ? await saveLiveEvent(this.data.liveId, payload)
        : await createLiveEvent(payload);
      const form = normalizeForm(saved);
      this.setData({
        saving: false,
        liveId: String(form.id || this.data.liveId),
        form,
        refOptions: optionListForVisibility(this.data.accessOptions, form.visibility)
      });
      showToast("保存成功", "success");
    } catch (error) {
      this.setData({ saving: false });
      showToast((error && error.message) || "保存失败");
    }
  }
});
```

- [ ] **Step 3: Create live edit layout**

Create `private-domain-operation/pages/live-edit/live-edit.wxml`:

```xml
<view class="page-shell">
  <scroll-view scroll-y class="live-edit-scroll content-safe-bottom">
    <view class="live-edit-nav">
      <view class="live-edit-back" bindtap="onBackTap">‹</view>
      <view class="live-edit-nav-copy">
        <text class="live-edit-nav-title">{{liveId ? '编辑直播' : '新建直播'}}</text>
        <text class="live-edit-nav-subtitle">{{form.title || '直播活动'}}</text>
      </view>
    </view>

    <view wx:if="{{loading}}" class="live-edit-section card-surface">
      <text class="live-edit-muted">加载中</text>
    </view>

    <block wx:else>
      <view class="live-edit-section card-surface">
        <view class="live-edit-section-head">
          <text class="live-edit-section-title">基础信息</text>
          <text class="live-edit-id">{{liveId ? 'ID ' + liveId : '新建'}}</text>
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">直播标题</text>
          <input class="live-edit-input" value="{{form.title}}" data-field="title" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">直播简介</text>
          <textarea class="live-edit-textarea" value="{{form.summary}}" data-field="summary" bindinput="onFieldInput" cursor-spacing="120"></textarea>
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">讲师</text>
          <input class="live-edit-input" value="{{form.speaker}}" data-field="speaker" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">封面 URL</text>
          <input class="live-edit-input live-edit-input--url" value="{{form.coverUrl}}" data-field="coverUrl" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
      </view>

      <view class="live-edit-section card-surface">
        <text class="live-edit-section-title">时间与链接</text>
        <view class="live-edit-field">
          <text class="live-edit-label">开始时间 RFC3339</text>
          <input class="live-edit-input" value="{{form.startAt}}" data-field="startAt" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">结束时间 RFC3339</text>
          <input class="live-edit-input" value="{{form.endAt}}" data-field="endAt" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">直播 HTTPS 链接</text>
          <input class="live-edit-input live-edit-input--url" value="{{form.liveUrl}}" data-field="liveUrl" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
        <view class="live-edit-field">
          <text class="live-edit-label">回放 HTTPS 链接</text>
          <input class="live-edit-input live-edit-input--url" value="{{form.replayUrl}}" data-field="replayUrl" bindinput="onFieldInput" cursor-spacing="120" />
        </view>
        <view class="live-edit-switch-row">
          <text class="live-edit-label">开放回放</text>
          <switch checked="{{form.replayEnabled}}" bindchange="onReplaySwitch" />
        </view>
      </view>

      <view class="live-edit-section card-surface">
        <text class="live-edit-section-title">状态覆盖</text>
        <view class="live-edit-chip-row">
          <view wx:for="{{statusOptions}}" wx:key="key" class="live-edit-chip {{item.key === form.statusOverride ? 'live-edit-chip--active' : ''}}" data-status="{{item.key}}" bindtap="onStatusTap">{{item.label}}</view>
        </view>
      </view>

      <view class="live-edit-section card-surface">
        <text class="live-edit-section-title">观看权限</text>
        <view class="live-edit-chip-row">
          <view wx:for="{{visibilityOptions}}" wx:key="key" class="live-edit-chip {{item.key === form.visibility ? 'live-edit-chip--active' : ''}}" data-visibility="{{item.key}}" bindtap="onVisibilityTap">{{item.label}}</view>
        </view>
        <view wx:if="{{refOptions.length}}" class="live-edit-ref-list">
          <view wx:for="{{refOptions}}" wx:key="id" class="live-edit-ref {{item.id === form.visibilityRefId ? 'live-edit-ref--active' : ''}}" data-ref-id="{{item.id}}" bindtap="onRefTap">{{item.title}}</view>
        </view>
      </view>
    </block>

    <view class="live-edit-bottom-spacer"></view>
  </scroll-view>

  <view class="live-edit-footer">
    <view class="live-edit-save {{saving ? 'live-edit-save--disabled' : ''}}" bindtap="onSaveTap">{{saving ? '保存中' : '保存'}}</view>
  </view>
</view>
```

- [ ] **Step 4: Create live edit styles**

Create `private-domain-operation/pages/live-edit/live-edit.wxss` by copying the structure of `course-edit.wxss`, replacing the prefix `course-edit` with `live-edit`, and adding these selectors:

```css
.live-edit-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.live-edit-chip-row,
.live-edit-ref-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.live-edit-chip,
.live-edit-ref {
  min-width: 132rpx;
  min-height: 60rpx;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(239, 243, 255, 0.96);
  color: #7380a6;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.live-edit-chip--active,
.live-edit-ref--active {
  background: linear-gradient(135deg, #4f80ff 0%, #7258ff 100%);
  color: #ffffff;
}
```

- [ ] **Step 5: Create page config**

Create `private-domain-operation/pages/live-edit/live-edit.json`:

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 6: Validate frontend files**

Run:

```bash
node -c private-domain-operation/pages/live-edit/live-edit.js
node -e "JSON.parse(require('fs').readFileSync('private-domain-operation/pages/live-edit/live-edit.json', 'utf8')); JSON.parse(require('fs').readFileSync('private-domain-operation/app.json', 'utf8'))"
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit live edit page**

Run:

```bash
git add private-domain-operation/app.json private-domain-operation/pages/live-edit/live-edit.js private-domain-operation/pages/live-edit/live-edit.wxml private-domain-operation/pages/live-edit/live-edit.wxss private-domain-operation/pages/live-edit/live-edit.json
git commit -m "feat: add merchant live edit page"
```

Expected: commit created.

---

### Task 7: Add Live Access Gateway And Web Viewer

**Files:**
- Modify: `private-domain-operation/pages/live-room/live-room.js`
- Modify: `private-domain-operation/pages/live-room/live-room.wxml`
- Modify: `private-domain-operation/pages/live-room/live-room.wxss`
- Create: `private-domain-operation/pages/web-viewer/web-viewer.js`
- Create: `private-domain-operation/pages/web-viewer/web-viewer.wxml`
- Create: `private-domain-operation/pages/web-viewer/web-viewer.wxss`
- Create: `private-domain-operation/pages/web-viewer/web-viewer.json`

- [ ] **Step 1: Update live-room gateway controller**

Replace `private-domain-operation/pages/live-room/live-room.js` with:

```js
const {
  checkLiveAccess,
  fetchLiveRoomPageData
} = require("../../services/api/page-data");
const {
  openPageEntry,
  parseLiveRoomOptions,
  toWebViewer
} = require("../../utils/navigation");

function canUseWebView(url = "") {
  return /^https:\/\//.test(String(url || ""));
}

Page({
  data: {
    liveId: "",
    title: "直播间",
    mode: "live",
    messages: [],
    replayHighlights: [],
    checkingAccess: true,
    accessAllowed: false,
    accessDenied: false,
    accessReason: "",
    targetUrl: "",
    requiredAccess: null
  },

  async onLoad(options = {}) {
    const { liveId, mode, title } = parseLiveRoomOptions(options);

    try {
      const pageData = await fetchLiveRoomPageData(liveId, mode, title);
      this.setData({
        ...pageData,
        liveId,
        mode,
        title: pageData.title || title,
        checkingAccess: true
      });
      await this.checkAccess();
    } catch (error) {
      this.setData({
        checkingAccess: false,
        accessDenied: true,
        accessReason: (error && error.message) || "直播间加载失败"
      });
    }
  },

  async checkAccess() {
    try {
      const decision = await checkLiveAccess(this.data.liveId, this.data.mode);
      if (decision && decision.allowed) {
        this.setData({
          checkingAccess: false,
          accessAllowed: true,
          accessDenied: false,
          targetUrl: decision.targetUrl || ""
        });
        if (canUseWebView(decision.targetUrl)) {
          openPageEntry({
            url: toWebViewer(decision.targetUrl, this.data.title),
            method: "navigateTo"
          }, "打开直播");
        }
        return;
      }

      this.setData({
        checkingAccess: false,
        accessAllowed: false,
        accessDenied: true,
        accessReason: (decision && decision.reason) || "当前账号暂无观看权限",
        requiredAccess: decision && decision.requiredAccess ? decision.requiredAccess : null
      });
    } catch (error) {
      this.setData({
        checkingAccess: false,
        accessDenied: true,
        accessReason: (error && error.message) || "观看权限校验失败"
      });
    }
  },

  onBackTap() {
    wx.navigateBack({ delta: 1 });
  },

  onCopyTap() {
    if (!this.data.targetUrl) {
      wx.showToast({ title: "暂无可复制链接", icon: "none" });
      return;
    }
    wx.setClipboardData({ data: this.data.targetUrl });
  },

  onAskTap() {
    if (this.data.accessAllowed && this.data.targetUrl) {
      this.onCopyTap();
      return;
    }
    wx.showToast({
      title: this.data.accessReason || "互动能力暂未接入",
      icon: "none"
    });
  }
});
```

- [ ] **Step 2: Update live-room markup**

Add this block in `private-domain-operation/pages/live-room/live-room.wxml` above the first `live-room-stage`:

```xml
    <view wx:if="{{checkingAccess}}" class="live-room-section card-surface">
      <text class="live-room-section-title">正在校验观看权限</text>
      <text class="live-room-notice">请稍候</text>
    </view>

    <view wx:elif="{{accessDenied}}" class="live-room-section card-surface">
      <text class="live-room-section-title">暂不能观看</text>
      <text class="live-room-notice">{{accessReason}}</text>
      <view wx:if="{{requiredAccess && requiredAccess.title}}" class="related-card">
        <text class="related-tag">需要权限</text>
        <text class="related-title">{{requiredAccess.title}}</text>
        <text class="related-desc">请先完成对应课程、训练营或会员开通。</text>
      </view>
    </view>

    <view wx:elif="{{accessAllowed && targetUrl}}" class="live-room-section card-surface">
      <text class="live-room-section-title">已通过观看校验</text>
      <text class="live-room-notice">已尝试打开直播链接，如未打开可复制链接到浏览器。</text>
      <view class="live-room-copy" bindtap="onCopyTap">复制链接</view>
    </view>
```

Keep the existing live-room stage and static interaction display below this gateway block.

- [ ] **Step 3: Add live-room copy style**

Append to `private-domain-operation/pages/live-room/live-room.wxss`:

```css
.live-room-copy {
  align-self: flex-start;
  min-width: 160rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: rgba(92, 108, 255, 0.1);
  color: #5a6efa;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
```

- [ ] **Step 4: Create web-viewer controller**

Create `private-domain-operation/pages/web-viewer/web-viewer.js`:

```js
function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function isHttpsUrl(value = "") {
  return /^https:\/\//.test(String(value || ""));
}

Page({
  data: {
    title: "直播",
    url: "",
    valid: false
  },

  onLoad(options = {}) {
    const url = safeDecode(options.url);
    this.setData({
      title: safeDecode(options.title) || "直播",
      url,
      valid: isHttpsUrl(url)
    });
  },

  onBackTap() {
    wx.navigateBack({ delta: 1 });
  },

  onCopyTap() {
    if (!this.data.url) {
      wx.showToast({ title: "暂无可复制链接", icon: "none" });
      return;
    }
    wx.setClipboardData({ data: this.data.url });
  }
});
```

- [ ] **Step 5: Create web-viewer markup and styles**

Create `private-domain-operation/pages/web-viewer/web-viewer.wxml`:

```xml
<view class="page-shell">
  <view class="web-viewer-nav">
    <view class="web-viewer-back" bindtap="onBackTap">‹</view>
    <view class="web-viewer-nav-copy">
      <text class="web-viewer-nav-title">{{title}}</text>
      <text class="web-viewer-nav-subtitle">{{valid ? '正在打开 HTTPS 链接' : '链接不可内嵌打开'}}</text>
    </view>
  </view>

  <web-view wx:if="{{valid}}" src="{{url}}"></web-view>

  <view wx:else class="web-viewer-fallback card-surface">
    <text class="web-viewer-title">链接暂不可打开</text>
    <text class="web-viewer-desc">小程序 web-view 仅支持符合要求的 HTTPS 业务域名链接，可先复制链接使用。</text>
    <view class="web-viewer-copy" bindtap="onCopyTap">复制链接</view>
  </view>
</view>
```

Create `private-domain-operation/pages/web-viewer/web-viewer.wxss`:

```css
.web-viewer-nav {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 10;
  padding: calc(48rpx + env(safe-area-inset-top)) 28rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: rgba(35, 45, 90, 0.92);
  box-sizing: border-box;
}

.web-viewer-back {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 44rpx;
  line-height: 72rpx;
  text-align: center;
  flex-shrink: 0;
}

.web-viewer-nav-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.web-viewer-nav-title {
  font-size: 34rpx;
  line-height: 1.2;
  color: #ffffff;
  font-weight: 800;
}

.web-viewer-nav-subtitle {
  font-size: 22rpx;
  line-height: 1.45;
  color: rgba(241, 244, 255, 0.82);
}

.web-viewer-fallback {
  margin: calc(168rpx + env(safe-area-inset-top)) 28rpx 0;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.web-viewer-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #202742;
}

.web-viewer-desc {
  font-size: 26rpx;
  line-height: 1.7;
  color: #7f89ab;
}

.web-viewer-copy {
  width: 100%;
  height: 80rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #4f80ff 0%, #7258ff 100%);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

Create `private-domain-operation/pages/web-viewer/web-viewer.json`:

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 6: Validate gateway files**

Run:

```bash
node -c private-domain-operation/pages/live-room/live-room.js
node -c private-domain-operation/pages/web-viewer/web-viewer.js
node -e "JSON.parse(require('fs').readFileSync('private-domain-operation/pages/web-viewer/web-viewer.json', 'utf8'))"
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit gateway work**

Run:

```bash
git add private-domain-operation/pages/live-room/live-room.js private-domain-operation/pages/live-room/live-room.wxml private-domain-operation/pages/live-room/live-room.wxss private-domain-operation/pages/web-viewer/web-viewer.js private-domain-operation/pages/web-viewer/web-viewer.wxml private-domain-operation/pages/web-viewer/web-viewer.wxss private-domain-operation/pages/web-viewer/web-viewer.json
git commit -m "feat: add live access gateway"
```

Expected: commit created.

---

### Task 8: Update Docs And Run End-To-End Verification

**Files:**
- Modify: `private-domain-operation/README.md`
- Modify: `private-domain-operation/TODO.md`

- [ ] **Step 1: Update README**

Add a "Live Management And Access" subsection to `private-domain-operation/README.md` with these endpoint groups:

````markdown
### Live Management And Access

Live events use ordinary HTTPS links in the first implementation. The backend stores live and replay links in SQLite and validates access before the mini program opens a link.

User APIs:

- `GET /api/v1/live-events?status=all|upcoming|live|replay`
- `GET /api/v1/live-events/:live_id`
- `GET /api/v1/live-events/:live_id/room`
- `POST /api/v1/live-events/:live_id/access-check`

Merchant APIs:

- `GET /api/v1/merchant/live-events?status=all|upcoming|live|ended|replay`
- `POST /api/v1/merchant/live-events`
- `GET /api/v1/merchant/live-events/:live_id/edit`
- `PUT /api/v1/merchant/live-events/:live_id`
- `GET /api/v1/merchant/access-options`

Local verification:

```bash
cd private-domain-operation/backend
./scripts/optools test
./scripts/optools restart
./scripts/optools status
```
````

- [ ] **Step 2: Update task list**

In `private-domain-operation/TODO.md`, change the P1 live access item from unchecked to checked after implementation:

```markdown
- [x] 直播准入规则：按课程、训练营、会员、角色控制观看权限
```

Leave media delivery as unchecked until real SFTP/Nginx HTTPS resources are prepared.

- [ ] **Step 3: Run backend verification**

Run:

```bash
cd private-domain-operation/backend
go test ./...
```

Expected: PASS.

- [ ] **Step 4: Run frontend syntax verification**

Run:

```bash
node -c private-domain-operation/services/api/page-data.js
node -c private-domain-operation/utils/navigation.js
node -c private-domain-operation/pages/live-management/live-management.js
node -c private-domain-operation/pages/live-edit/live-edit.js
node -c private-domain-operation/pages/live-room/live-room.js
node -c private-domain-operation/pages/web-viewer/web-viewer.js
node -e "JSON.parse(require('fs').readFileSync('private-domain-operation/app.json', 'utf8')); JSON.parse(require('fs').readFileSync('private-domain-operation/pages/live-edit/live-edit.json', 'utf8')); JSON.parse(require('fs').readFileSync('private-domain-operation/pages/web-viewer/web-viewer.json', 'utf8'))"
```

Expected: all commands exit 0.

- [ ] **Step 5: Run local daemon smoke test**

Run:

```bash
cd private-domain-operation/backend
./scripts/optools restart
./scripts/optools status
curl -s http://127.0.0.1:8088/api/v1/live-events | head
./scripts/optools stop
```

Expected:

- `optools status` reports the backend running.
- `curl` output contains `liveList`.
- `optools stop` stops the daemon cleanly.

- [ ] **Step 6: Manual mini program verification**

In WeChat DevTools:

1. Log in as merchant with the configured merchant openid.
2. Open `pages/merchant-dashboard/merchant-dashboard`.
3. Navigate to live management.
4. Tap `新建直播`.
5. Fill title, RFC3339 start/end time, HTTPS live link, and course visibility.
6. Save and verify success toast.
7. Return to live management and verify the new live event appears.
8. Open user live list.
9. Open live detail for a seed live event.
10. Tap the primary live action.
11. Verify the room page calls access-check.
12. Verify allowed users navigate to `web-viewer` or can copy the link.
13. Verify denied users see the reason and required access title.

- [ ] **Step 7: Commit docs and verification notes**

Run:

```bash
git add private-domain-operation/README.md private-domain-operation/TODO.md
git commit -m "docs: document live management access"
```

Expected: commit created.

---

## Final Verification

Run:

```bash
cd private-domain-operation/backend
go test ./...
```

Expected: PASS.

Run:

```bash
node -c private-domain-operation/services/api/page-data.js
node -c private-domain-operation/utils/navigation.js
node -c private-domain-operation/pages/live-management/live-management.js
node -c private-domain-operation/pages/live-edit/live-edit.js
node -c private-domain-operation/pages/live-room/live-room.js
node -c private-domain-operation/pages/web-viewer/web-viewer.js
node -e "JSON.parse(require('fs').readFileSync('private-domain-operation/app.json', 'utf8')); JSON.parse(require('fs').readFileSync('private-domain-operation/pages/live-edit/live-edit.json', 'utf8')); JSON.parse(require('fs').readFileSync('private-domain-operation/pages/web-viewer/web-viewer.json', 'utf8'))"
```

Expected: all commands exit 0.

Run:

```bash
git status --short
```

Expected: no uncommitted files after the final docs commit.

## Spec Coverage Review

- Merchant create/edit/status/access configuration is covered by Tasks 4, 5, and 6.
- User live list/detail/room SQLite reads are covered by Tasks 2, 4, and 7.
- Backend strong access validation is covered by Tasks 2, 3, and 4.
- Seed course/bootcamp/member grants are covered by Task 1.
- Web-view first and copy-link fallback are covered by Task 7.
- HTTPS validation without URL rewriting is covered by Task 3.
- Mock fallback is preserved by Task 5.
- Docs and task tracking are covered by Task 8.
