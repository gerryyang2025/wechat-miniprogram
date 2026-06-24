package repository

import (
	"context"
	"path/filepath"
	"testing"

	appdb "private-domain-operation/backend/internal/db"
)

func TestCourseRepositoryLoadsSeedCourse(t *testing.T) {
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

	repo := NewCourseRepository(conn)
	course, err := repo.GetPlayerCourse(ctx, 1, 2)
	if err != nil {
		t.Fatalf("GetPlayerCourse returned error: %v", err)
	}
	if course.Title != "AIGC 视频制作" {
		t.Fatalf("course title = %q", course.Title)
	}
	if len(course.Chapters) != 1 {
		t.Fatalf("chapters = %d", len(course.Chapters))
	}
	if len(course.Chapters[0].Lessons) != 3 {
		t.Fatalf("lessons = %d", len(course.Chapters[0].Lessons))
	}
	if course.ProgressSummary.CompletedLessons != 0 {
		t.Fatalf("completed lessons = %d", course.ProgressSummary.CompletedLessons)
	}
	if course.ProgressSummary.TotalLessons != 3 {
		t.Fatalf("total lessons = %d", course.ProgressSummary.TotalLessons)
	}
	if course.ProgressSummary.Percent != 0 {
		t.Fatalf("progress percent = %d", course.ProgressSummary.Percent)
	}
	if course.ProgressSummary.LastPosition != "暂未开始" {
		t.Fatalf("last position = %q", course.ProgressSummary.LastPosition)
	}
	if course.ProgressSummary.CurrentLessonID != 1 {
		t.Fatalf("current lesson id = %d", course.ProgressSummary.CurrentLessonID)
	}

	progressRepo := NewProgressRepository(conn)
	if err := progressRepo.UpsertProgress(ctx, 2, 1, 2, true, 202); err != nil {
		t.Fatalf("UpsertProgress returned error: %v", err)
	}

	updated, err := repo.GetPlayerCourse(ctx, 1, 2)
	if err != nil {
		t.Fatalf("GetPlayerCourse after progress update returned error: %v", err)
	}
	if updated.ProgressSummary.CompletedLessons != 2 {
		t.Fatalf("updated completed lessons = %d", updated.ProgressSummary.CompletedLessons)
	}
	if updated.ProgressSummary.TotalLessons != 3 {
		t.Fatalf("updated total lessons = %d", updated.ProgressSummary.TotalLessons)
	}
	if updated.ProgressSummary.Percent != 67 {
		t.Fatalf("updated progress percent = %d", updated.ProgressSummary.Percent)
	}
	if updated.ProgressSummary.LastPosition != "上次看到 03:22" {
		t.Fatalf("updated last position = %q", updated.ProgressSummary.LastPosition)
	}
	if updated.ProgressSummary.CurrentLessonID != 2 {
		t.Fatalf("updated current lesson id = %d", updated.ProgressSummary.CurrentLessonID)
	}
}
