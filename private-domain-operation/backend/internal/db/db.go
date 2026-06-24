package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func Open(path string) (*sql.DB, error) {
	if path == "" {
		return nil, fmt.Errorf("database path is required")
	}

	if err := ensureParentDir(path); err != nil {
		return nil, err
	}

	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	if _, err := conn.Exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;"); err != nil {
		conn.Close()
		return nil, err
	}

	return conn, nil
}

func ensureParentDir(path string) error {
	dir := filepath.Dir(path)
	if dir == "." || dir == "" {
		return nil
	}
	return os.MkdirAll(dir, 0o755)
}
