package repository

import (
	"context"
	"path/filepath"
	"testing"

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
