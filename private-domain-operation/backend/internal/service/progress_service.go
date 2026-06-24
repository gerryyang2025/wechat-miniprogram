package service

import (
	"context"
	"errors"
	"math"

	"private-domain-operation/backend/internal/domain"
)

var ErrProgressStoreRequired = errors.New("progress store is required")

type ProgressStore interface {
	UpsertProgress(ctx context.Context, userID int64, courseID int64, lessonID int64, completed bool, seconds int) error
	CourseAnalytics(ctx context.Context, courseID int64) (domain.CourseAnalytics, error)
}

type ProgressService struct {
	progress ProgressStore
}

func NewProgressService(progress ProgressStore) *ProgressService {
	return &ProgressService{progress: progress}
}

func (s *ProgressService) UpdateProgress(ctx context.Context, userID int64, courseID int64, lessonID int64, completed bool, seconds int) error {
	if s.progress == nil {
		return ErrProgressStoreRequired
	}
	return s.progress.UpsertProgress(ctx, userID, courseID, lessonID, completed, seconds)
}

func (s *ProgressService) CourseAnalytics(ctx context.Context, courseID int64) (domain.CourseAnalytics, error) {
	if s.progress == nil {
		return domain.CourseAnalytics{}, ErrProgressStoreRequired
	}
	return s.progress.CourseAnalytics(ctx, courseID)
}

func progressPercent(completed int, total int) int {
	if total <= 0 {
		return 0
	}
	return int(math.Round(float64(completed) / float64(total) * 100))
}
