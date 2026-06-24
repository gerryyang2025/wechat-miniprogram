package repository

import (
	"context"
	"path/filepath"
	"testing"

	appdb "private-domain-operation/backend/internal/db"
	"private-domain-operation/backend/internal/domain"
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
	if updated.VideoURL != "https://media.example.com/courses/aigc/lesson-002.mp4" {
		t.Fatalf("updated video url = %q", updated.VideoURL)
	}
	if updated.Duration != "03:22" {
		t.Fatalf("updated duration = %q", updated.Duration)
	}
	if updated.ResourceState != "ready" {
		t.Fatalf("updated resource state = %q", updated.ResourceState)
	}
}

func TestCourseRepositoryClampsStaleProgressSummary(t *testing.T) {
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
		UPDATE learning_progress
		SET completed_lessons = 9, total_lessons = 0, progress_percent = 300
		WHERE user_id = 2 AND course_id = 1
	`); err != nil {
		t.Fatalf("stale progress update returned error: %v", err)
	}

	repo := NewCourseRepository(conn)
	course, err := repo.GetPlayerCourse(ctx, 1, 2)
	if err != nil {
		t.Fatalf("GetPlayerCourse returned error: %v", err)
	}
	if course.ProgressSummary.CompletedLessons != 3 {
		t.Fatalf("completed lessons = %d", course.ProgressSummary.CompletedLessons)
	}
	if course.ProgressSummary.TotalLessons != 3 {
		t.Fatalf("total lessons = %d", course.ProgressSummary.TotalLessons)
	}
	if course.ProgressSummary.Percent != 100 {
		t.Fatalf("progress percent = %d", course.ProgressSummary.Percent)
	}
}

func TestCourseRepositoryIgnoresLessonsFromOtherCourses(t *testing.T) {
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
		INSERT INTO course_lessons (id, course_id, chapter_id, title, duration_seconds, sort_order, status)
		VALUES (20, 2, 1, 'Other course misplaced lesson', 99, 99, 'published')
	`); err != nil {
		t.Fatalf("insert mismatched lesson returned error: %v", err)
	}

	repo := NewCourseRepository(conn)
	course, err := repo.GetPlayerCourse(ctx, 1, 2)
	if err != nil {
		t.Fatalf("GetPlayerCourse returned error: %v", err)
	}
	if len(course.Chapters) != 1 {
		t.Fatalf("chapters = %d", len(course.Chapters))
	}
	if len(course.Chapters[0].Lessons) != 3 {
		t.Fatalf("lessons = %d", len(course.Chapters[0].Lessons))
	}
}

func TestCourseRepositoryLoadsOnlyRecordedVideoMedia(t *testing.T) {
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
		DELETE FROM media_assets
		WHERE course_id = 1 AND lesson_id = 2 AND media_type = 'video'
	`); err != nil {
		t.Fatalf("delete video asset returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `
		INSERT INTO media_assets (
			merchant_id, course_id, lesson_id, media_type, storage_provider, object_key,
			play_url, cover_url, duration_seconds, file_size, source_type, status
		)
		VALUES (1, 1, 2, 'image', 'sftp', 'courses/aigc/lesson-002-poster.jpg',
			'https://media.example.com/images/lesson-002-poster.jpg',
			'https://media.example.com/images/lesson-002-poster-cover.jpg',
			88, 0, 'lesson_attachment', 'ready')
	`); err != nil {
		t.Fatalf("insert image asset returned error: %v", err)
	}

	repo := NewCourseRepository(conn)
	edit, err := repo.GetCourseEdit(ctx, 1)
	if err != nil {
		t.Fatalf("GetCourseEdit returned error: %v", err)
	}
	editLesson, ok := findCourseEditLesson(edit.Lessons, 2)
	if !ok {
		t.Fatalf("edit lesson 2 missing: %#v", edit.Lessons)
	}
	if editLesson.VideoURL != "" {
		t.Fatalf("edit lesson video URL = %q, want empty non-video asset ignored", editLesson.VideoURL)
	}
	if editLesson.CoverURL != "" {
		t.Fatalf("edit lesson cover URL = %q, want empty non-video asset ignored", editLesson.CoverURL)
	}

	course, err := repo.GetPlayerCourse(ctx, 1, 2)
	if err != nil {
		t.Fatalf("GetPlayerCourse returned error: %v", err)
	}
	playerLesson, ok := findDomainLesson(course.Chapters, 2)
	if !ok {
		t.Fatalf("player lesson 2 missing: %#v", course.Chapters)
	}
	if playerLesson.VideoURL != "" {
		t.Fatalf("player lesson video URL = %q, want empty non-video asset ignored", playerLesson.VideoURL)
	}
	if playerLesson.CoverURL != "" {
		t.Fatalf("player lesson cover URL = %q, want empty non-video asset ignored", playerLesson.CoverURL)
	}
	if playerLesson.DurationSeconds != 202 {
		t.Fatalf("player lesson duration = %d, want lesson duration 202", playerLesson.DurationSeconds)
	}
}

func TestCourseRepositorySaveCourseEditDoesNotModifyNonVideoMedia(t *testing.T) {
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
		DELETE FROM media_assets
		WHERE course_id = 1 AND lesson_id = 2 AND media_type = 'video'
	`); err != nil {
		t.Fatalf("delete video asset returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `
		INSERT INTO media_assets (
			merchant_id, course_id, lesson_id, media_type, storage_provider, object_key,
			play_url, cover_url, duration_seconds, file_size, source_type, status
		)
		VALUES (1, 1, 2, 'image', 'sftp', 'courses/aigc/lesson-002-poster.jpg',
			'https://media.example.com/images/original-poster.jpg',
			'https://media.example.com/images/original-cover.jpg',
			88, 0, 'lesson_attachment', 'ready')
	`); err != nil {
		t.Fatalf("insert image asset returned error: %v", err)
	}

	repo := NewCourseRepository(conn)
	_, err = repo.SaveCourseEdit(ctx, 1, domain.CourseEditPayload{
		Title:       "AIGC 视频制作",
		Description: "从脚本构思、口播表达，到成片剪辑与发布节奏。",
		Status:      "published",
		CoverURL:    "https://media.example.com/covers/aigc/lesson-001.jpg",
		Lessons: []domain.CourseEditLesson{{
			ID:              2,
			Title:           "第 2 节 AIGC 视频脚本拆解 - 更新",
			VideoURL:        "https://media.example.com/courses/aigc/lesson-002-new.mp4",
			CoverURL:        "https://media.example.com/covers/aigc/lesson-002-new.jpg",
			DurationSeconds: 333,
		}},
	})
	if err != nil {
		t.Fatalf("SaveCourseEdit returned error: %v", err)
	}

	var imagePlayURL string
	var imageCoverURL string
	var imageDuration int
	if err := conn.QueryRowContext(ctx, `
		SELECT play_url, cover_url, duration_seconds
		FROM media_assets
		WHERE course_id = 1 AND lesson_id = 2 AND media_type = 'image' AND source_type = 'lesson_attachment'
	`).Scan(&imagePlayURL, &imageCoverURL, &imageDuration); err != nil {
		t.Fatalf("image asset query returned error: %v", err)
	}
	if imagePlayURL != "https://media.example.com/images/original-poster.jpg" {
		t.Fatalf("image play URL = %q", imagePlayURL)
	}
	if imageCoverURL != "https://media.example.com/images/original-cover.jpg" {
		t.Fatalf("image cover URL = %q", imageCoverURL)
	}
	if imageDuration != 88 {
		t.Fatalf("image duration = %d", imageDuration)
	}

	var videoCount int
	if err := conn.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM media_assets
		WHERE course_id = 1
			AND lesson_id = 2
			AND media_type = 'video'
			AND source_type = 'recorded_course'
			AND play_url = 'https://media.example.com/courses/aigc/lesson-002-new.mp4'
			AND cover_url = 'https://media.example.com/covers/aigc/lesson-002-new.jpg'
			AND duration_seconds = 333
	`).Scan(&videoCount); err != nil {
		t.Fatalf("video asset count query returned error: %v", err)
	}
	if videoCount != 1 {
		t.Fatalf("video asset count = %d, want 1", videoCount)
	}
}

func findCourseEditLesson(lessons []domain.CourseEditLesson, id int64) (domain.CourseEditLesson, bool) {
	for _, lesson := range lessons {
		if lesson.ID == id {
			return lesson, true
		}
	}
	return domain.CourseEditLesson{}, false
}

func findDomainLesson(chapters []domain.Chapter, id int64) (domain.Lesson, bool) {
	for _, chapter := range chapters {
		for _, lesson := range chapter.Lessons {
			if lesson.ID == id {
				return lesson, true
			}
		}
	}
	return domain.Lesson{}, false
}
