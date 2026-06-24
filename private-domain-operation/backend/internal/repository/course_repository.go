package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"private-domain-operation/backend/internal/domain"
)

type CourseRepository struct {
	db *sql.DB
}

type courseLessonQuerier interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
}

func NewCourseRepository(db *sql.DB) *CourseRepository {
	return &CourseRepository{db: db}
}

func (r *CourseRepository) GetPlayerCourse(ctx context.Context, courseID int64, userID int64) (domain.PlayerCourse, error) {
	var course domain.PlayerCourse
	var productCover string
	err := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.title, COALESCE(c.description, ''), p.cover_url
		FROM courses c
		JOIN products p ON p.id = c.product_id
		WHERE c.id = ?
	`, courseID).Scan(&course.ID, &course.Title, &course.Description, &productCover)
	if err != nil {
		return domain.PlayerCourse{}, err
	}

	course.PlayerCourseID = fmt.Sprintf("course-%d", course.ID)
	course.CoverURL = productCover
	course.SourceLabel = "录播课程"
	course.OutlineText = "继续学习当前课程，完成课节后会同步学习进度。"

	chapters, err := r.loadChapters(ctx, course.ID)
	if err != nil {
		return domain.PlayerCourse{}, err
	}
	course.Chapters = chapters
	course.ProgressSummary, err = r.loadProgressSummary(ctx, course.ID, userID, chapters)
	if err != nil {
		return domain.PlayerCourse{}, err
	}

	lesson, ok := lessonByID(chapters, course.ProgressSummary.CurrentLessonID)
	if !ok {
		lesson, ok = firstLesson(chapters)
	}
	if ok {
		course.VideoURL = lesson.VideoURL
		course.ResourceState = lesson.ResourceState
		course.Duration = lesson.Duration
	}

	return course, nil
}

func (r *CourseRepository) GetCourseEdit(ctx context.Context, courseID int64) (domain.CourseEditPayload, error) {
	var payload domain.CourseEditPayload
	err := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.title, COALESCE(c.description, ''), c.status, COALESCE(p.cover_url, '')
		FROM courses c
		JOIN products p ON p.id = c.product_id
		WHERE c.id = ?
	`, courseID).Scan(&payload.ID, &payload.Title, &payload.Description, &payload.Status, &payload.CoverURL)
	if err != nil {
		return domain.CourseEditPayload{}, err
	}

	lessons, err := loadCourseEditLessons(ctx, r.db, courseID)
	if err != nil {
		return domain.CourseEditPayload{}, err
	}
	payload.Lessons = lessons
	return payload, nil
}

func (r *CourseRepository) SaveCourseEdit(ctx context.Context, courseID int64, payload domain.CourseEditPayload) (domain.CourseEditPayload, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.CourseEditPayload{}, err
	}
	defer tx.Rollback()

	var productID int64
	var merchantID int64
	err = tx.QueryRowContext(ctx, `
		SELECT product_id, merchant_id
		FROM courses
		WHERE id = ?
	`, courseID).Scan(&productID, &merchantID)
	if err != nil {
		return domain.CourseEditPayload{}, err
	}

	currentLessons, err := loadCourseEditLessons(ctx, tx, courseID)
	if err != nil {
		return domain.CourseEditPayload{}, err
	}
	currentLessonsByID := make(map[int64]domain.CourseEditLesson, len(currentLessons))
	for _, lesson := range currentLessons {
		currentLessonsByID[lesson.ID] = lesson
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE products
		SET title = ?, cover_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, payload.Title, payload.CoverURL, payload.Status, productID); err != nil {
		return domain.CourseEditPayload{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE courses
		SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, payload.Title, payload.Description, payload.Status, courseID); err != nil {
		return domain.CourseEditPayload{}, err
	}

	for _, lesson := range payload.Lessons {
		lesson = mergeCourseEditLesson(currentLessonsByID[lesson.ID], lesson)
		result, err := tx.ExecContext(ctx, `
			UPDATE course_lessons
			SET title = ?, duration_seconds = ?, updated_at = CURRENT_TIMESTAMP
			WHERE course_id = ? AND id = ?
		`, lesson.Title, lesson.DurationSeconds, courseID, lesson.ID)
		if err != nil {
			return domain.CourseEditPayload{}, err
		}
		affected, err := result.RowsAffected()
		if err != nil {
			return domain.CourseEditPayload{}, err
		}
		if affected == 0 {
			return domain.CourseEditPayload{}, sql.ErrNoRows
		}
		if err := upsertLessonMedia(ctx, tx, merchantID, courseID, lesson); err != nil {
			return domain.CourseEditPayload{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return domain.CourseEditPayload{}, err
	}

	return r.GetCourseEdit(ctx, courseID)
}

func (r *CourseRepository) loadCourseEditLessons(ctx context.Context, courseID int64) ([]domain.CourseEditLesson, error) {
	return loadCourseEditLessons(ctx, r.db, courseID)
}

func loadCourseEditLessons(ctx context.Context, q courseLessonQuerier, courseID int64) ([]domain.CourseEditLesson, error) {
	rows, err := q.QueryContext(ctx, `
		SELECT
			l.id,
			l.title,
			COALESCE(ma.play_url, ''),
			COALESCE(ma.cover_url, ''),
			l.duration_seconds
		FROM course_lessons l
		LEFT JOIN media_assets ma ON ma.id = (
			SELECT id
			FROM media_assets
			WHERE course_id = l.course_id AND lesson_id = l.id
				AND media_type = 'video'
				AND source_type = 'recorded_course'
			ORDER BY id
			LIMIT 1
		)
		WHERE l.course_id = ?
		ORDER BY l.sort_order, l.id
	`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lessons := make([]domain.CourseEditLesson, 0)
	for rows.Next() {
		var lesson domain.CourseEditLesson
		if err := rows.Scan(&lesson.ID, &lesson.Title, &lesson.VideoURL, &lesson.CoverURL, &lesson.DurationSeconds); err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return lessons, nil
}

func mergeCourseEditLesson(current domain.CourseEditLesson, incoming domain.CourseEditLesson) domain.CourseEditLesson {
	if current.ID == 0 {
		return incoming
	}
	merged := incoming
	if merged.VideoURL == "" {
		merged.VideoURL = current.VideoURL
	}
	if merged.CoverURL == "" {
		merged.CoverURL = current.CoverURL
	}
	if merged.DurationSeconds == 0 {
		merged.DurationSeconds = current.DurationSeconds
	}
	return merged
}

func upsertLessonMedia(ctx context.Context, tx *sql.Tx, merchantID int64, courseID int64, lesson domain.CourseEditLesson) error {
	var mediaID int64
	err := tx.QueryRowContext(ctx, `
		SELECT id
		FROM media_assets
		WHERE course_id = ? AND lesson_id = ?
			AND media_type = 'video'
			AND source_type = 'recorded_course'
		ORDER BY id
		LIMIT 1
	`, courseID, lesson.ID).Scan(&mediaID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	status := mediaStatusForURL(lesson.VideoURL)
	if err == nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE media_assets
			SET play_url = ?, cover_url = ?, duration_seconds = ?, status = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`, lesson.VideoURL, lesson.CoverURL, lesson.DurationSeconds, status, mediaID)
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO media_assets (
			merchant_id, course_id, lesson_id, media_type, storage_provider, object_key,
			play_url, cover_url, duration_seconds, file_size, source_type, status
		)
		VALUES (?, ?, ?, 'video', 'sftp', ?, ?, ?, ?, 0, 'recorded_course', ?)
	`, merchantID, courseID, lesson.ID, lessonMediaObjectKey(courseID, lesson.ID), lesson.VideoURL, lesson.CoverURL, lesson.DurationSeconds, status)
	return err
}

func mediaStatusForURL(videoURL string) string {
	if strings.TrimSpace(videoURL) == "" {
		return "uploading"
	}
	return "ready"
}

func lessonMediaObjectKey(courseID int64, lessonID int64) string {
	return fmt.Sprintf("courses/%d/lessons/%d/video", courseID, lessonID)
}

func (r *CourseRepository) loadChapters(ctx context.Context, courseID int64) ([]domain.Chapter, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, title, summary
		FROM course_chapters
		WHERE course_id = ?
		ORDER BY sort_order, id
	`, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	chapters := make([]domain.Chapter, 0)
	for rows.Next() {
		var chapter domain.Chapter
		if err := rows.Scan(&chapter.ID, &chapter.Title, &chapter.Summary); err != nil {
			return nil, err
		}

		lessons, err := r.loadLessons(ctx, courseID, chapter.ID)
		if err != nil {
			return nil, err
		}
		chapter.Lessons = lessons
		chapters = append(chapters, chapter)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return chapters, nil
}

func (r *CourseRepository) loadLessons(ctx context.Context, courseID int64, chapterID int64) ([]domain.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			l.id,
			l.title,
			l.duration_seconds,
			l.status,
			COALESCE(ma.play_url, ''),
			COALESCE(ma.cover_url, ''),
			COALESCE(ma.duration_seconds, 0),
			COALESCE(ma.status, '')
		FROM course_lessons l
		LEFT JOIN media_assets ma ON ma.id = (
			SELECT id
			FROM media_assets
			WHERE course_id = l.course_id AND lesson_id = l.id
				AND media_type = 'video'
				AND source_type = 'recorded_course'
			ORDER BY id
			LIMIT 1
		)
		WHERE l.chapter_id = ? AND l.course_id = ?
		ORDER BY l.sort_order, l.id
	`, chapterID, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lessons := make([]domain.Lesson, 0)
	for rows.Next() {
		var lesson domain.Lesson
		var lessonDurationSeconds int
		var mediaDurationSeconds int
		var mediaStatus string
		if err := rows.Scan(
			&lesson.ID,
			&lesson.Title,
			&lessonDurationSeconds,
			&lesson.Status,
			&lesson.VideoURL,
			&lesson.CoverURL,
			&mediaDurationSeconds,
			&mediaStatus,
		); err != nil {
			return nil, err
		}

		lesson.DurationSeconds = lessonDurationSeconds
		if mediaDurationSeconds > 0 {
			lesson.DurationSeconds = mediaDurationSeconds
		}
		lesson.Duration = formatDuration(lesson.DurationSeconds)
		lesson.ResourceState = resourceState(mediaStatus, lesson.VideoURL)
		lesson.StateLabel = lessonStateLabel(lesson.Status, lesson.ResourceState)
		lessons = append(lessons, lesson)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return lessons, nil
}

func (r *CourseRepository) loadProgressSummary(ctx context.Context, courseID int64, userID int64, chapters []domain.Chapter) (domain.ProgressView, error) {
	loadedTotal := lessonCount(chapters)
	progress := domain.ProgressView{
		TotalLessons:    loadedTotal,
		CurrentLessonID: firstLessonID(chapters),
	}

	err := r.db.QueryRowContext(ctx, `
		SELECT completed_lessons, total_lessons, progress_percent, progress_seconds, last_position, COALESCE(lesson_id, 0)
		FROM learning_progress
		WHERE user_id = ? AND course_id = ?
	`, userID, courseID).Scan(
		&progress.CompletedLessons,
		&progress.TotalLessons,
		&progress.Percent,
		&progress.ProgressSeconds,
		&progress.LastPosition,
		&progress.CurrentLessonID,
	)
	if err == sql.ErrNoRows {
		return progress, nil
	}
	if err != nil {
		return domain.ProgressView{}, err
	}

	if loadedTotal > 0 && progress.TotalLessons != loadedTotal {
		progress.TotalLessons = loadedTotal
	}
	if progress.CurrentLessonID == 0 {
		progress.CurrentLessonID = firstLessonID(chapters)
	}
	progress.CompletedLessons = clampInt(progress.CompletedLessons, 0, progress.TotalLessons)
	progress.Percent = progressPercent(progress.CompletedLessons, progress.TotalLessons)

	return progress, nil
}

func lessonCount(chapters []domain.Chapter) int {
	total := 0
	for _, chapter := range chapters {
		total += len(chapter.Lessons)
	}
	return total
}

func clampInt(value int, minValue int, maxValue int) int {
	if maxValue < minValue {
		maxValue = minValue
	}
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}

func firstLessonID(chapters []domain.Chapter) int64 {
	lesson, ok := firstLesson(chapters)
	if !ok {
		return 0
	}
	return lesson.ID
}

func firstLesson(chapters []domain.Chapter) (domain.Lesson, bool) {
	for _, chapter := range chapters {
		if len(chapter.Lessons) > 0 {
			return chapter.Lessons[0], true
		}
	}
	return domain.Lesson{}, false
}

func lessonByID(chapters []domain.Chapter, lessonID int64) (domain.Lesson, bool) {
	if lessonID == 0 {
		return domain.Lesson{}, false
	}
	for _, chapter := range chapters {
		for _, lesson := range chapter.Lessons {
			if lesson.ID == lessonID {
				return lesson, true
			}
		}
	}
	return domain.Lesson{}, false
}

func formatDuration(seconds int) string {
	if seconds < 0 {
		seconds = 0
	}
	return fmt.Sprintf("%02d:%02d", seconds/60, seconds%60)
}

func resourceState(mediaStatus string, playURL string) string {
	if strings.TrimSpace(playURL) == "" {
		return "preparing"
	}
	if mediaStatus == "ready" {
		return "ready"
	}
	return "preparing"
}

func lessonStateLabel(status string, resourceState string) string {
	if resourceState == "preparing" {
		return "准备中"
	}
	if status == "published" {
		return "待学习"
	}
	return status
}
