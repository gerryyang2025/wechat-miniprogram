package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"private-domain-operation/backend/internal/domain"
)

var (
	ErrCourseStoreRequired = errors.New("course store is required")
	ErrCourseValidation    = errors.New("course validation failed")
)

type CourseStore interface {
	GetPlayerCourse(ctx context.Context, courseID int64, userID int64) (domain.PlayerCourse, error)
	GetCourseEdit(ctx context.Context, courseID int64) (domain.CourseEditPayload, error)
	SaveCourseEdit(ctx context.Context, courseID int64, payload domain.CourseEditPayload) (domain.CourseEditPayload, error)
}

type CourseService struct {
	courses CourseStore
}

func NewCourseService(courses CourseStore) *CourseService {
	return &CourseService{courses: courses}
}

func (s *CourseService) GetPlayerCourse(ctx context.Context, courseID int64, userID int64) (domain.PlayerCourse, error) {
	if s.courses == nil {
		return domain.PlayerCourse{}, ErrCourseStoreRequired
	}
	return s.courses.GetPlayerCourse(ctx, courseID, userID)
}

func (s *CourseService) GetCourseEdit(ctx context.Context, courseID int64) (domain.CourseEditPayload, error) {
	if s.courses == nil {
		return domain.CourseEditPayload{}, ErrCourseStoreRequired
	}
	return s.courses.GetCourseEdit(ctx, courseID)
}

func (s *CourseService) SaveCourseEdit(ctx context.Context, courseID int64, payload domain.CourseEditPayload) (domain.CourseEditPayload, error) {
	if s.courses == nil {
		return domain.CourseEditPayload{}, ErrCourseStoreRequired
	}
	if err := validateCourseEdit(payload); err != nil {
		return domain.CourseEditPayload{}, err
	}
	return s.courses.SaveCourseEdit(ctx, courseID, payload)
}

func validateCourseEdit(payload domain.CourseEditPayload) error {
	if strings.TrimSpace(payload.Title) == "" {
		return fmt.Errorf("%w: course title is required", ErrCourseValidation)
	}
	if payload.Status != "published" && payload.Status != "draft" {
		return fmt.Errorf("%w: course status must be published or draft", ErrCourseValidation)
	}
	if payload.CoverURL != "" && !strings.HasPrefix(payload.CoverURL, "https://") {
		return fmt.Errorf("%w: cover url must use https", ErrCourseValidation)
	}
	for _, lesson := range payload.Lessons {
		if strings.TrimSpace(lesson.Title) == "" {
			return fmt.Errorf("%w: lesson title is required", ErrCourseValidation)
		}
		if lesson.VideoURL != "" && !strings.HasPrefix(lesson.VideoURL, "https://") {
			return fmt.Errorf("%w: lesson video url must use https", ErrCourseValidation)
		}
		if lesson.CoverURL != "" && !strings.HasPrefix(lesson.CoverURL, "https://") {
			return fmt.Errorf("%w: lesson cover url must use https", ErrCourseValidation)
		}
		if lesson.DurationSeconds < 0 {
			return fmt.Errorf("%w: lesson duration cannot be negative", ErrCourseValidation)
		}
	}
	return nil
}
