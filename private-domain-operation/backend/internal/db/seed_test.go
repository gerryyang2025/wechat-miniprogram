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
