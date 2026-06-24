package db

import (
	"context"
	"database/sql"
	"path/filepath"
	"strings"
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
	if err := Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("second Migrate returned error: %v", err)
	}

	assertTableExists(t, conn, "users")
	assertTableExists(t, conn, "products")
	assertTableExists(t, conn, "course_lessons")
	assertTableExists(t, conn, "learning_progress")
	assertMigrationRecorded(t, conn, "000001_p0_schema.up.sql")
}

func TestOpenEnforcesForeignKeysOnPooledConnections(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "pdo.db")

	conn, err := Open(path)
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	heldConn, err := conn.Conn(ctx)
	if err != nil {
		t.Fatalf("Conn returned error: %v", err)
	}
	defer heldConn.Close()

	_, err = conn.ExecContext(ctx, `
		CREATE TABLE parents (
			id INTEGER PRIMARY KEY
		);
		CREATE TABLE children (
			id INTEGER PRIMARY KEY,
			parent_id INTEGER NOT NULL,
			CONSTRAINT fk_children_parent FOREIGN KEY (parent_id) REFERENCES parents(id)
		);
	`)
	if err != nil {
		t.Fatalf("schema setup failed: %v", err)
	}

	_, err = conn.ExecContext(ctx, "INSERT INTO children(parent_id) VALUES (?)", 123)
	if err == nil {
		t.Fatal("expected foreign key constraint failure")
	}
	if !strings.Contains(strings.ToLower(err.Error()), "constraint") {
		t.Fatalf("expected constraint error, got %v", err)
	}
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

func assertMigrationRecorded(t *testing.T, conn *sql.DB, name string) {
	t.Helper()

	var count int
	err := conn.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE filename = ?", name).Scan(&count)
	if err != nil {
		t.Fatalf("migration check for %s failed: %v", name, err)
	}
	if count != 1 {
		t.Fatalf("migration %s was not recorded", name)
	}
}
