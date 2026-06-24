package db

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"
)

func TestOpenAndMigrateCreatesCoreTables(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "pdo.db")

	conn, err := Open(path)
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	if err := Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}

	assertTableExists(t, conn, "users")
	assertTableExists(t, conn, "products")
	assertTableExists(t, conn, "course_lessons")
	assertTableExists(t, conn, "learning_progress")
}

func assertTableExists(t *testing.T, conn *sql.DB, name string) {
	t.Helper()

	var count int
	err := conn.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?", name).Scan(&count)
	if err != nil {
		t.Fatalf("table check for %s failed: %v", name, err)
	}
	if count != 1 {
		t.Fatalf("table %s does not exist", name)
	}
}
