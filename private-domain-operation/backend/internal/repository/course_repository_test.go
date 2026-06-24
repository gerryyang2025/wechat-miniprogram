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
}
