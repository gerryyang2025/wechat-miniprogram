package db

import (
	"context"
	"database/sql"
	"path/filepath"
	"strings"
	"testing"
)

func TestSeedMinimalDataIsIdempotent(t *testing.T) {
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

	if err := SeedMinimal(ctx, conn, SeedOptions{MerchantOpenID: "merchant-openid", StudentOpenID: "student-openid"}); err != nil {
		t.Fatalf("first seed returned error: %v", err)
	}
	if err := SeedMinimal(ctx, conn, SeedOptions{MerchantOpenID: "merchant-openid", StudentOpenID: "student-openid"}); err != nil {
		t.Fatalf("second seed returned error: %v", err)
	}

	var courseCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM courses").Scan(&courseCount); err != nil {
		t.Fatalf("course count failed: %v", err)
	}
	if courseCount != 1 {
		t.Fatalf("course count = %d", courseCount)
	}

	var lessonCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM course_lessons").Scan(&lessonCount); err != nil {
		t.Fatalf("lesson count failed: %v", err)
	}
	if lessonCount != 3 {
		t.Fatalf("lesson count = %d", lessonCount)
	}

	var readyMediaCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM media_assets WHERE status = 'ready'").Scan(&readyMediaCount); err != nil {
		t.Fatalf("ready media count failed: %v", err)
	}
	if readyMediaCount != 2 {
		t.Fatalf("ready media count = %d", readyMediaCount)
	}

	var uploadingMediaCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM media_assets WHERE status = 'uploading'").Scan(&uploadingMediaCount); err != nil {
		t.Fatalf("uploading media count failed: %v", err)
	}
	if uploadingMediaCount != 1 {
		t.Fatalf("uploading media count = %d", uploadingMediaCount)
	}

	var slotCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM operation_slots WHERE slot_key = 'home_recommended_course' AND status = 'active'").Scan(&slotCount); err != nil {
		t.Fatalf("operation slot count failed: %v", err)
	}
	if slotCount != 1 {
		t.Fatalf("operation slot count = %d", slotCount)
	}

	var progressCount int
	if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM learning_progress WHERE user_id = 2 AND course_id = 1").Scan(&progressCount); err != nil {
		t.Fatalf("learning progress count failed: %v", err)
	}
	if progressCount != 1 {
		t.Fatalf("learning progress count = %d", progressCount)
	}
}

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

	assertLiveEventSeed(t, ctx, conn, 1, "course", sql.NullInt64{Int64: 1, Valid: true}, "upcoming", "", 1, true, true)
	assertLiveEventSeed(t, ctx, conn, 2, "member", sql.NullInt64{Int64: 1, Valid: true}, "live", "live", 0, true, false)
	assertLiveEventSeed(t, ctx, conn, 3, "bootcamp", sql.NullInt64{Int64: 1, Valid: true}, "ended", "replay", 1, true, true)
	assertLiveEventSeed(t, ctx, conn, 4, "all", sql.NullInt64{}, "upcoming", "", 0, true, false)

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

	var bootcampGrantCount int
	if err := conn.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM content_access_grants
		WHERE user_id = 2 AND access_type = 'bootcamp' AND access_ref_id = 1 AND status = 'active'
	`).Scan(&bootcampGrantCount); err != nil {
		t.Fatalf("bootcamp grant count failed: %v", err)
	}
	if bootcampGrantCount != 1 {
		t.Fatalf("bootcamp grant count = %d, want 1", bootcampGrantCount)
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

	var activeGrantCount int
	if err := conn.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM content_access_grants
		WHERE user_id = 2 AND status = 'active'
	`).Scan(&activeGrantCount); err != nil {
		t.Fatalf("active grant count failed: %v", err)
	}
	if activeGrantCount != 3 {
		t.Fatalf("active grant count = %d, want 3", activeGrantCount)
	}
}

func TestSeedMinimalRefreshesSeedUserOpenIDs(t *testing.T) {
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
	if err := SeedMinimal(ctx, conn, SeedOptions{MerchantOpenID: "real-merchant-openid", StudentOpenID: "real-student-openid"}); err != nil {
		t.Fatalf("second seed returned error: %v", err)
	}

	assertSeedUser(t, conn, 1, "real-merchant-openid", "Gerry", "active")
	assertSeedUser(t, conn, 2, "real-student-openid", "时昕同学", "active")
}

func TestSeedMinimalRefreshesOpenIDsWithoutOverwritingProfileFields(t *testing.T) {
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
	if _, err := conn.ExecContext(ctx, "UPDATE users SET nickname = ?, status = ? WHERE id = 1", "Custom Merchant", "inactive"); err != nil {
		t.Fatalf("merchant customization failed: %v", err)
	}
	if _, err := conn.ExecContext(ctx, "UPDATE users SET nickname = ?, status = ? WHERE id = 2", "Custom Student", "inactive"); err != nil {
		t.Fatalf("student customization failed: %v", err)
	}

	if err := SeedMinimal(ctx, conn, SeedOptions{MerchantOpenID: "real-merchant-openid", StudentOpenID: "real-student-openid"}); err != nil {
		t.Fatalf("second seed returned error: %v", err)
	}

	assertSeedUser(t, conn, 1, "real-merchant-openid", "Custom Merchant", "inactive")
	assertSeedUser(t, conn, 2, "real-student-openid", "Custom Student", "inactive")
}

func TestSeedMinimalRejectsOpenIDOwnedByDifferentUser(t *testing.T) {
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
	if _, err := conn.ExecContext(ctx, "INSERT INTO users (id, openid, nickname, status) VALUES (99, ?, 'Existing', 'active')", "real-merchant-openid"); err != nil {
		t.Fatalf("conflict user setup failed: %v", err)
	}

	err = SeedMinimal(ctx, conn, SeedOptions{MerchantOpenID: "real-merchant-openid"})
	if err == nil {
		t.Fatal("expected seed conflict error")
	}
	if !strings.Contains(err.Error(), "openid") {
		t.Fatalf("expected openid conflict error, got %v", err)
	}

	assertSeedUser(t, conn, 1, "mock-openid-merchant", "Gerry", "active")
}

func assertSeedUser(t *testing.T, conn *sql.DB, id int, wantOpenID string, wantNickname string, wantStatus string) {
	t.Helper()

	var openid string
	var nickname string
	var status string
	if err := conn.QueryRow("SELECT openid, nickname, status FROM users WHERE id = ?", id).Scan(&openid, &nickname, &status); err != nil {
		t.Fatalf("seed user %d query failed: %v", id, err)
	}
	if openid != wantOpenID {
		t.Fatalf("seed user %d openid = %q", id, openid)
	}
	if nickname != wantNickname {
		t.Fatalf("seed user %d nickname = %q", id, nickname)
	}
	if status != wantStatus {
		t.Fatalf("seed user %d status = %q", id, status)
	}
}

func assertLiveEventSeed(
	t *testing.T,
	ctx context.Context,
	conn *sql.DB,
	id int,
	wantVisibility string,
	wantVisibilityRefID sql.NullInt64,
	wantStatus string,
	wantStatusOverride string,
	wantReplayEnabled int,
	wantLiveURLHTTPS bool,
	wantReplayURLHTTPS bool,
) {
	t.Helper()

	var visibility string
	var visibilityRefID sql.NullInt64
	var status string
	var statusOverride string
	var replayEnabled int
	var liveURL string
	var replayURL string
	if err := conn.QueryRowContext(ctx, `
		SELECT visibility, visibility_ref_id, status, status_override, replay_enabled, live_url, replay_url
		FROM live_events
		WHERE id = ?
	`, id).Scan(&visibility, &visibilityRefID, &status, &statusOverride, &replayEnabled, &liveURL, &replayURL); err != nil {
		t.Fatalf("live event %d query failed: %v", id, err)
	}
	if visibility != wantVisibility {
		t.Fatalf("live event %d visibility = %q, want %q", id, visibility, wantVisibility)
	}
	if visibilityRefID.Valid != wantVisibilityRefID.Valid {
		t.Fatalf("live event %d visibility_ref_id valid = %t, want %t", id, visibilityRefID.Valid, wantVisibilityRefID.Valid)
	}
	if visibilityRefID.Valid && visibilityRefID.Int64 != wantVisibilityRefID.Int64 {
		t.Fatalf("live event %d visibility_ref_id = %d, want %d", id, visibilityRefID.Int64, wantVisibilityRefID.Int64)
	}
	if status != wantStatus {
		t.Fatalf("live event %d status = %q, want %q", id, status, wantStatus)
	}
	if statusOverride != wantStatusOverride {
		t.Fatalf("live event %d status_override = %q, want %q", id, statusOverride, wantStatusOverride)
	}
	if replayEnabled != wantReplayEnabled {
		t.Fatalf("live event %d replay_enabled = %d, want %d", id, replayEnabled, wantReplayEnabled)
	}
	if wantLiveURLHTTPS && !strings.HasPrefix(liveURL, "https://") {
		t.Fatalf("live event %d live_url = %q, want https:// prefix", id, liveURL)
	}
	if wantReplayURLHTTPS && !strings.HasPrefix(replayURL, "https://") {
		t.Fatalf("live event %d replay_url = %q, want https:// prefix", id, replayURL)
	}
}
