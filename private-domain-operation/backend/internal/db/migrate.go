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

	for _, file := range files {
		body, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		sqlText := strings.TrimSpace(string(body))
		if sqlText == "" {
			continue
		}
		if _, err := conn.ExecContext(ctx, sqlText); err != nil {
			return fmt.Errorf("migration %s failed: %w", filepath.Base(file), err)
		}
	}

	return nil
}
