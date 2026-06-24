package repository

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	appdb "private-domain-operation/backend/internal/db"
)

func TestProgressRepositoryIncompleteUpdateDoesNotAdvanceCompletedLessons(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn, err := appdb.Open(filepath.Join(t.TempDir(), "pdo.db"))
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	if err := appdb.Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := appdb.SeedMinimal(ctx, conn, appdb.SeedOptions{}); err != nil {
		t.Fatalf("SeedMinimal returned error: %v", err)
	}

	repo := NewProgressRepository(conn)
	if err := repo.UpsertProgress(ctx, 2, 1, 2, false, 42); err != nil {
		t.Fatalf("UpsertProgress returned error: %v", err)
	}

	var lessonID int64
	var completedLessons int
	var progressSeconds int
	var lastPosition string
	if err := conn.QueryRowContext(ctx, `
		SELECT lesson_id, completed_lessons, progress_seconds, last_position
		FROM learning_progress
		WHERE user_id = 2 AND course_id = 1
	`).Scan(&lessonID, &completedLessons, &progressSeconds, &lastPosition); err != nil {
		t.Fatalf("progress query returned error: %v", err)
	}
	if lessonID != 2 {
		t.Fatalf("lesson id = %d", lessonID)
	}
	if completedLessons != 0 {
		t.Fatalf("completed lessons = %d", completedLessons)
	}
	if progressSeconds != 42 {
		t.Fatalf("progress seconds = %d", progressSeconds)
	}
	if lastPosition != "上次看到 00:42" {
		t.Fatalf("last position = %q", lastPosition)
	}
}

func TestProgressRepositoryIncompleteUpdateDoesNotReduceCompletedLessons(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn, err := appdb.Open(filepath.Join(t.TempDir(), "pdo.db"))
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	if err := appdb.Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := appdb.SeedMinimal(ctx, conn, appdb.SeedOptions{}); err != nil {
		t.Fatalf("SeedMinimal returned error: %v", err)
	}

	repo := NewProgressRepository(conn)
	if err := repo.UpsertProgress(ctx, 2, 1, 2, true, 202); err != nil {
		t.Fatalf("completed UpsertProgress returned error: %v", err)
	}
	if err := repo.UpsertProgress(ctx, 2, 1, 1, false, 11); err != nil {
		t.Fatalf("incomplete UpsertProgress returned error: %v", err)
	}

	var lessonID int64
	var completedLessons int
	var progressSeconds int
	var lastPosition string
	if err := conn.QueryRowContext(ctx, `
		SELECT lesson_id, completed_lessons, progress_seconds, last_position
		FROM learning_progress
		WHERE user_id = 2 AND course_id = 1
	`).Scan(&lessonID, &completedLessons, &progressSeconds, &lastPosition); err != nil {
		t.Fatalf("progress query returned error: %v", err)
	}
	if lessonID != 1 {
		t.Fatalf("lesson id = %d", lessonID)
	}
	if completedLessons != 2 {
		t.Fatalf("completed lessons = %d", completedLessons)
	}
	if progressSeconds != 11 {
		t.Fatalf("progress seconds = %d", progressSeconds)
	}
	if lastPosition != "上次看到 00:11" {
		t.Fatalf("last position = %q", lastPosition)
	}
}

func TestProgressRepositoryStaleCompletedUpdateDoesNotRegress(t *testing.T) {
	ctx := context.Background()
	dbPath := filepath.Join(t.TempDir(), "pdo.db")
	conn, err := appdb.Open(dbPath)
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	if err := appdb.Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := appdb.SeedMinimal(ctx, conn, appdb.SeedOptions{}); err != nil {
		t.Fatalf("SeedMinimal returned error: %v", err)
	}

	lockConn, err := appdb.Open(dbPath)
	if err != nil {
		t.Fatalf("Open lock connection returned error: %v", err)
	}
	defer lockConn.Close()
	if _, err := lockConn.ExecContext(ctx, `BEGIN IMMEDIATE`); err != nil {
		t.Fatalf("BEGIN IMMEDIATE returned error: %v", err)
	}

	repo := NewProgressRepository(conn)
	done := make(chan error, 1)
	go func() {
		done <- repo.UpsertProgress(ctx, 2, 1, 1, true, 11)
	}()

	time.Sleep(100 * time.Millisecond)

	if _, err := lockConn.ExecContext(ctx, `
		UPDATE learning_progress
		SET lesson_id = 3,
			completed_lessons = 3,
			total_lessons = 3,
			progress_percent = 100,
			progress_seconds = 303,
			last_position = '上次看到 05:03'
		WHERE user_id = 2 AND course_id = 1
	`); err != nil {
		lockConn.ExecContext(ctx, `ROLLBACK`)
		t.Fatalf("locked progress update returned error: %v", err)
	}
	if _, err := lockConn.ExecContext(ctx, `COMMIT`); err != nil {
		t.Fatalf("COMMIT returned error: %v", err)
	}

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("UpsertProgress returned error: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("UpsertProgress did not finish after lock release")
	}

	var completedLessons int
	var progressPercent int
	if err := conn.QueryRowContext(ctx, `
		SELECT completed_lessons, progress_percent
		FROM learning_progress
		WHERE user_id = 2 AND course_id = 1
	`).Scan(&completedLessons, &progressPercent); err != nil {
		t.Fatalf("progress query returned error: %v", err)
	}
	if completedLessons != 3 {
		t.Fatalf("completed lessons = %d, want monotonic 3", completedLessons)
	}
	if progressPercent != 100 {
		t.Fatalf("progress percent = %d, want 100", progressPercent)
	}
}

func TestProgressRepositoryTotalLessonsIgnoresMismatchedChapterCourse(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	conn, err := appdb.Open(filepath.Join(t.TempDir(), "pdo.db"))
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	defer conn.Close()

	if err := appdb.Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := appdb.SeedMinimal(ctx, conn, appdb.SeedOptions{}); err != nil {
		t.Fatalf("SeedMinimal returned error: %v", err)
	}

	if _, err := conn.ExecContext(ctx, `
		INSERT INTO products (id, merchant_id, product_type, title, status)
		VALUES (2, 1, 'course', 'Other Course', 'published')
	`); err != nil {
		t.Fatalf("insert product returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `
		INSERT INTO courses (id, product_id, merchant_id, title, status)
		VALUES (2, 2, 1, 'Other Course', 'published')
	`); err != nil {
		t.Fatalf("insert course returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `
		INSERT INTO course_chapters (id, course_id, title)
		VALUES (2, 2, 'Other Chapter')
	`); err != nil {
		t.Fatalf("insert chapter returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `
		INSERT INTO course_lessons (id, course_id, chapter_id, title, status)
		VALUES (20, 1, 2, 'Mismatched lesson', 'published')
	`); err != nil {
		t.Fatalf("insert mismatched lesson returned error: %v", err)
	}

	repo := NewProgressRepository(conn)
	if err := repo.UpsertProgress(ctx, 2, 1, 2, true, 202); err != nil {
		t.Fatalf("UpsertProgress returned error: %v", err)
	}

	var totalLessons int
	var progressPercent int
	if err := conn.QueryRowContext(ctx, `
		SELECT total_lessons, progress_percent
		FROM learning_progress
		WHERE user_id = 2 AND course_id = 1
	`).Scan(&totalLessons, &progressPercent); err != nil {
		t.Fatalf("progress query returned error: %v", err)
	}
	if totalLessons != 3 {
		t.Fatalf("total lessons = %d", totalLessons)
	}
	if progressPercent != 67 {
		t.Fatalf("progress percent = %d", progressPercent)
	}
}
