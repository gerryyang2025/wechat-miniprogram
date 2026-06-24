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

	if len(chapters) > 0 && len(chapters[0].Lessons) > 0 {
		first := chapters[0].Lessons[0]
		course.VideoURL = first.VideoURL
		course.ResourceState = first.ResourceState
		course.Duration = first.Duration
	}

	return course, nil
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

		lessons, err := r.loadLessons(ctx, chapter.ID)
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

func (r *CourseRepository) loadLessons(ctx context.Context, chapterID int64) ([]domain.Lesson, error) {
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
			ORDER BY id
			LIMIT 1
		)
		WHERE l.chapter_id = ?
		ORDER BY l.sort_order, l.id
	`, chapterID)
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
