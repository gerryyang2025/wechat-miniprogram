package repository

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"
	"time"

	appdb "private-domain-operation/backend/internal/db"
	"private-domain-operation/backend/internal/domain"
)

func TestLiveRepositoryListsAndLoadsSeedLiveEvents(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	events, err := repo.ListLiveEvents(ctx, domain.LiveListFilter{Status: "all"})
	if err != nil {
		t.Fatalf("ListLiveEvents returned error: %v", err)
	}
	if len(events) != 4 {
		t.Fatalf("events = %d, want 4", len(events))
	}
	liveStatusEvents, err := repo.ListLiveEvents(ctx, domain.LiveListFilter{Status: "live"})
	if err != nil {
		t.Fatalf("ListLiveEvents live filter returned error: %v", err)
	}
	if len(liveStatusEvents) != 4 {
		t.Fatalf("live filter events = %d, want 4", len(liveStatusEvents))
	}
	if events[0].PublicID == "" {
		t.Fatalf("first event PublicID is empty")
	}
	if events[0].Title == "" {
		t.Fatalf("first event Title is empty")
	}
	if events[0].Status == "" {
		t.Fatalf("first event Status is empty")
	}
	for _, event := range events {
		assertRawLiveDisplayFieldsEmpty(t, event)
	}

	detail, err := repo.GetLiveDetail(ctx, 1)
	if err != nil {
		t.Fatalf("GetLiveDetail returned error: %v", err)
	}
	if detail.Title != "私域运营直播答疑" {
		t.Fatalf("detail title = %q", detail.Title)
	}
	if detail.Visibility != "course" {
		t.Fatalf("detail visibility = %q", detail.Visibility)
	}
	if detail.RequiredAccess.Type != "course" {
		t.Fatalf("detail required access type = %q", detail.RequiredAccess.Type)
	}
	assertRawLiveDisplayFieldsEmpty(t, detail.LiveEvent)
}

func TestLiveRepositorySavesMerchantLiveEvent(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	created, err := repo.CreateLiveEvent(ctx, 1, domain.LiveEditPayload{
		Title:           "私域直播新主题",
		Summary:         "围绕社群转化和直播复盘。",
		Speaker:         "Gerry",
		CoverURL:        "https://media.example.com/covers/live/new-session.jpg",
		StartAt:         "2026-06-27T20:00:00+08:00",
		EndAt:           "2026-06-27T21:00:00+08:00",
		StatusOverride:  "live",
		LiveURL:         "https://media.example.com/live/new-session.m3u8",
		ReplayURL:       "https://media.example.com/replay/new-session.mp4",
		Visibility:      "all",
		ReplayEnabled:   true,
		VisibilityRefID: 0,
	})
	if err != nil {
		t.Fatalf("CreateLiveEvent returned error: %v", err)
	}
	if created.ID == 0 {
		t.Fatalf("created ID = 0")
	}
	if created.Visibility != "all" {
		t.Fatalf("created visibility = %q", created.Visibility)
	}
	if created.VisibilityRefID != 0 {
		t.Fatalf("created visibility ref id = %d", created.VisibilityRefID)
	}

	var visibilityRefID sql.NullInt64
	if err := conn.QueryRowContext(ctx, `
		SELECT visibility_ref_id
		FROM live_events
		WHERE id = ?
	`, created.ID).Scan(&visibilityRefID); err != nil {
		t.Fatalf("created visibility ref query returned error: %v", err)
	}
	if visibilityRefID.Valid {
		t.Fatalf("created visibility_ref_id valid = true, want NULL")
	}

	updated, err := repo.UpdateLiveEvent(ctx, created.ID, domain.LiveEditPayload{
		Title:           "私域直播新主题 - 更新",
		Summary:         created.Summary,
		Speaker:         created.Speaker,
		CoverURL:        created.CoverURL,
		StartAt:         created.StartAt,
		EndAt:           created.EndAt,
		StatusOverride:  created.StatusOverride,
		LiveURL:         created.LiveURL,
		ReplayURL:       created.ReplayURL,
		Visibility:      "course",
		VisibilityRefID: 1,
		ReplayEnabled:   created.ReplayEnabled,
	})
	if err != nil {
		t.Fatalf("UpdateLiveEvent returned error: %v", err)
	}
	if updated.Title != "私域直播新主题 - 更新" {
		t.Fatalf("updated title = %q", updated.Title)
	}
	if updated.Visibility != "course" {
		t.Fatalf("updated visibility = %q", updated.Visibility)
	}
	if updated.VisibilityRefID != 1 {
		t.Fatalf("updated visibility ref id = %d", updated.VisibilityRefID)
	}
}

func TestLiveRepositoryChecksContentAccessGrants(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	hasGrant, err := repo.HasActiveGrant(ctx, 2, "course", 1)
	if err != nil {
		t.Fatalf("HasActiveGrant returned error: %v", err)
	}
	if !hasGrant {
		t.Fatalf("user 2 course grant = false, want true")
	}

	hasGrant, err = repo.HasActiveGrant(ctx, 999, "course", 1)
	if err != nil {
		t.Fatalf("HasActiveGrant missing user returned error: %v", err)
	}
	if hasGrant {
		t.Fatalf("user 999 course grant = true, want false")
	}

	now := time.Now().UTC()
	sameDayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).Format(time.RFC3339)
	nextDayExpires := now.Add(24 * time.Hour).Format(time.RFC3339)
	if _, err := conn.ExecContext(ctx, `
		INSERT INTO content_access_grants (
			user_id, access_type, access_ref_id, source_type, source_id, starts_at, expires_at, status
		)
		VALUES (2, 'course', 4, 'test', 'rfc3339-course-4', ?, ?, 'active')
	`, sameDayStart, nextDayExpires); err != nil {
		t.Fatalf("insert RFC3339 grant returned error: %v", err)
	}
	hasGrant, err = repo.HasActiveGrant(ctx, 2, "course", 4)
	if err != nil {
		t.Fatalf("HasActiveGrant RFC3339 grant returned error: %v", err)
	}
	if !hasGrant {
		t.Fatalf("RFC3339 grant = false, want true")
	}

	if _, err := conn.ExecContext(ctx, `
		INSERT INTO content_access_grants (
			user_id, access_type, access_ref_id, source_type, source_id, starts_at, status
		)
		VALUES (2, 'course', 2, 'test', 'future-course-2', datetime('now', '+1 day'), 'active')
	`); err != nil {
		t.Fatalf("insert future grant returned error: %v", err)
	}
	hasGrant, err = repo.HasActiveGrant(ctx, 2, "course", 2)
	if err != nil {
		t.Fatalf("HasActiveGrant future grant returned error: %v", err)
	}
	if hasGrant {
		t.Fatalf("future grant = true, want false")
	}

	if _, err := conn.ExecContext(ctx, `
		INSERT INTO content_access_grants (
			user_id, access_type, access_ref_id, source_type, source_id, expires_at, status
		)
		VALUES (2, 'course', 3, 'test', 'expired-course-3', datetime('now', '-1 day'), 'active')
	`); err != nil {
		t.Fatalf("insert expired grant returned error: %v", err)
	}
	hasGrant, err = repo.HasActiveGrant(ctx, 2, "course", 3)
	if err != nil {
		t.Fatalf("HasActiveGrant expired grant returned error: %v", err)
	}
	if hasGrant {
		t.Fatalf("expired grant = true, want false")
	}
}

func TestLiveRepositoryAccessOptionsIncludeSeedContent(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()
	insertOtherMerchantAccessContent(t, ctx, conn)

	repo := NewLiveRepository(conn)
	options, err := repo.GetAccessOptions(ctx, 1)
	if err != nil {
		t.Fatalf("GetAccessOptions returned error: %v", err)
	}

	course, ok := findLiveAccessOption(options.Courses, "course", 1)
	if !ok {
		t.Fatalf("course option type=course id=1 missing: %#v", options.Courses)
	}
	if course.Title != "AIGC 视频制作" {
		t.Fatalf("course option title = %q", course.Title)
	}
	if otherCourse, ok := findLiveAccessOption(options.Courses, "course", 20); ok {
		t.Fatalf("other merchant course leaked into options: %#v", otherCourse)
	}

	for _, bootcamp := range options.Bootcamps {
		if bootcamp.Type != "bootcamp" {
			t.Fatalf("bootcamp option type = %q", bootcamp.Type)
		}
	}
	if otherBootcamp, ok := findLiveAccessOption(options.Bootcamps, "bootcamp", 20); ok {
		t.Fatalf("other merchant bootcamp leaked into options: %#v", otherBootcamp)
	}

	member, ok := findLiveAccessOption(options.Members, "member", 1)
	if !ok {
		t.Fatalf("member option type=member id=1 missing: %#v", options.Members)
	}
	if member.Title == "" {
		t.Fatalf("member option title is empty")
	}
}

func TestLiveRepositoryFindsMerchantIDForUser(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn := testLiveDB(t, ctx)
	defer conn.Close()

	repo := NewLiveRepository(conn)
	merchantID, err := repo.MerchantIDForUser(ctx, 1)
	if err != nil {
		t.Fatalf("MerchantIDForUser seed merchant returned error: %v", err)
	}
	if merchantID != 1 {
		t.Fatalf("seed merchant ID = %d, want 1", merchantID)
	}

	_, err = repo.MerchantIDForUser(ctx, 2)
	if err != sql.ErrNoRows {
		t.Fatalf("MerchantIDForUser student error = %v, want sql.ErrNoRows", err)
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

func insertOtherMerchantAccessContent(t *testing.T, ctx context.Context, conn *sql.DB) {
	t.Helper()

	if _, err := conn.ExecContext(ctx, `INSERT INTO merchants (id, name, intro, status) VALUES (20, '其他商家', '测试隔离商家', 'active')`); err != nil {
		t.Fatalf("insert other merchant returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO products (id, merchant_id, product_type, title, status) VALUES (20, 20, 'course', '其他商家课程商品', 'published')`); err != nil {
		t.Fatalf("insert other merchant course product returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO courses (id, product_id, merchant_id, title, description, status) VALUES (20, 20, 20, '其他商家课程', '不应泄漏到商家 1。', 'published')`); err != nil {
		t.Fatalf("insert other merchant course returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO products (id, merchant_id, product_type, title, status) VALUES (21, 20, 'bootcamp', '其他商家训练营商品', 'published')`); err != nil {
		t.Fatalf("insert other merchant bootcamp product returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO bootcamps (id, product_id, merchant_id, title, subtitle, total_days, status) VALUES (20, 21, 20, '其他商家训练营', '不应泄漏到商家 1。', 7, 'active')`); err != nil {
		t.Fatalf("insert other merchant bootcamp returned error: %v", err)
	}
}

func assertRawLiveDisplayFieldsEmpty(t *testing.T, event domain.LiveEvent) {
	t.Helper()

	if event.EffectiveStatus != "" {
		t.Fatalf("event %d EffectiveStatus = %q, want empty", event.ID, event.EffectiveStatus)
	}
	if event.StatusLabel != "" {
		t.Fatalf("event %d StatusLabel = %q, want empty", event.ID, event.StatusLabel)
	}
	if event.Schedule != "" {
		t.Fatalf("event %d Schedule = %q, want empty", event.ID, event.Schedule)
	}
	if event.ActionText != "" {
		t.Fatalf("event %d ActionText = %q, want empty", event.ID, event.ActionText)
	}
}

func findLiveAccessOption(options []domain.LiveAccessOption, optionType string, id int64) (domain.LiveAccessOption, bool) {
	for _, option := range options {
		if option.Type == optionType && option.ID == id {
			return option, true
		}
	}
	return domain.LiveAccessOption{}, false
}
