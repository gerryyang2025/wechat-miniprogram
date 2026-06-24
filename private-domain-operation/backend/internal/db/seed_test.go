package db

import (
	"context"
	"path/filepath"
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
}
