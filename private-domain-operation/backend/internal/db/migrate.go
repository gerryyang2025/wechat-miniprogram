package db

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func Migrate(ctx context.Context, conn *sql.DB, migrationsDir string) error {
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.up.sql"))
	if err != nil {
		return err
	}
	sort.Strings(files)

	if len(files) == 0 {
		return fmt.Errorf("no migration files found in %s", migrationsDir)
	}

	if _, err := conn.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`); err != nil {
		return err
	}

	for _, file := range files {
		name := filepath.Base(file)
		var applied int
		err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM schema_migrations WHERE filename = ?", name).Scan(&applied)
		if err != nil {
			return err
		}
		if applied > 0 {
			continue
		}

		body, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		sqlText := strings.TrimSpace(string(body))
		tx, err := conn.BeginTx(ctx, nil)
		if err != nil {
			return err
		}

		if sqlText != "" {
			if _, err := tx.ExecContext(ctx, sqlText); err != nil {
				tx.Rollback()
				return fmt.Errorf("migration %s failed: %w", name, err)
			}
		}

		if _, err := tx.ExecContext(ctx, "INSERT INTO schema_migrations(filename) VALUES (?)", name); err != nil {
			tx.Rollback()
			return fmt.Errorf("migration %s record failed: %w", name, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("migration %s commit failed: %w", name, err)
		}
	}

	return nil
}
