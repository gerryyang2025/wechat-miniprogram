package repository

import (
	"context"
	"database/sql"
	"fmt"
	"math"
)

type ProgressRepository struct {
	db *sql.DB
}

func NewProgressRepository(db *sql.DB) *ProgressRepository {
	return &ProgressRepository{db: db}
}

func (r *ProgressRepository) UpsertProgress(ctx context.Context, userID int64, courseID int64, lessonID int64, completed bool, seconds int) error {
	totalLessons, err := r.totalLessons(ctx, courseID)
	if err != nil {
		return err
	}
	completedLessons, err := r.completedLessons(ctx, userID, courseID, lessonID, completed)
	if err != nil {
		return err
	}
	if completedLessons > totalLessons {
		completedLessons = totalLessons
	}
	percent := progressPercent(completedLessons, totalLessons)
	if seconds < 0 {
		seconds = 0
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO learning_progress (user_id, course_id, lesson_id, completed_lessons, total_lessons, progress_percent, progress_seconds, last_position, status, last_learned_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'learning', CURRENT_TIMESTAMP)
		ON CONFLICT(user_id, course_id) DO UPDATE SET
			lesson_id = excluded.lesson_id,
			completed_lessons = excluded.completed_lessons,
			total_lessons = excluded.total_lessons,
			progress_percent = excluded.progress_percent,
			progress_seconds = excluded.progress_seconds,
			last_position = excluded.last_position,
			last_learned_at = CURRENT_TIMESTAMP,
			updated_at = CURRENT_TIMESTAMP
	`, userID, courseID, lessonID, completedLessons, totalLessons, percent, seconds, "上次看到 "+formatSeconds(seconds))
	return err
}

func (r *ProgressRepository) totalLessons(ctx context.Context, courseID int64) (int, error) {
	var total int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM course_lessons
		WHERE course_id = ?
	`, courseID).Scan(&total)
	if err != nil {
		return 0, err
	}
	return total, nil
}

func (r *ProgressRepository) completedLessons(ctx context.Context, userID int64, courseID int64, lessonID int64, completed bool) (int, error) {
	order, err := r.lessonOrder(ctx, courseID, lessonID)
	if err != nil {
		return 0, err
	}

	before, err := r.lessonsBefore(ctx, courseID, order)
	if err != nil {
		return 0, err
	}

	nextCompleted := before
	if completed {
		nextCompleted++
	}

	currentCompleted, err := r.currentCompletedLessons(ctx, userID, courseID)
	if err != nil {
		return 0, err
	}
	if currentCompleted > nextCompleted {
		return currentCompleted, nil
	}
	return nextCompleted, nil
}

type lessonOrder struct {
	chapterSort int
	chapterID   int64
	lessonSort  int
	lessonID    int64
}

func (r *ProgressRepository) lessonOrder(ctx context.Context, courseID int64, lessonID int64) (lessonOrder, error) {
	var order lessonOrder
	err := r.db.QueryRowContext(ctx, `
		SELECT cc.sort_order, cc.id, cl.sort_order, cl.id
		FROM course_lessons cl
		JOIN course_chapters cc ON cc.id = cl.chapter_id
		WHERE cl.course_id = ? AND cl.id = ?
	`, courseID, lessonID).Scan(&order.chapterSort, &order.chapterID, &order.lessonSort, &order.lessonID)
	if err != nil {
		return lessonOrder{}, err
	}
	return order, nil
}

func (r *ProgressRepository) lessonsBefore(ctx context.Context, courseID int64, order lessonOrder) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM course_lessons cl
		JOIN course_chapters cc ON cc.id = cl.chapter_id
		WHERE cl.course_id = ?
			AND (
				cc.sort_order < ?
				OR (cc.sort_order = ? AND cc.id < ?)
				OR (cc.sort_order = ? AND cc.id = ? AND cl.sort_order < ?)
				OR (cc.sort_order = ? AND cc.id = ? AND cl.sort_order = ? AND cl.id < ?)
			)
	`, courseID,
		order.chapterSort,
		order.chapterSort, order.chapterID,
		order.chapterSort, order.chapterID, order.lessonSort,
		order.chapterSort, order.chapterID, order.lessonSort, order.lessonID,
	).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *ProgressRepository) currentCompletedLessons(ctx context.Context, userID int64, courseID int64) (int, error) {
	var completed int
	err := r.db.QueryRowContext(ctx, `
		SELECT completed_lessons
		FROM learning_progress
		WHERE user_id = ? AND course_id = ?
	`, userID, courseID).Scan(&completed)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return completed, nil
}

func progressPercent(completed int, total int) int {
	if total <= 0 {
		return 0
	}
	if completed < 0 {
		completed = 0
	}
	if completed > total {
		completed = total
	}
	return int(math.Round(float64(completed) / float64(total) * 100))
}

func formatSeconds(seconds int) string {
	if seconds < 0 {
		seconds = 0
	}
	return fmt.Sprintf("%02d:%02d", seconds/60, seconds%60)
}
