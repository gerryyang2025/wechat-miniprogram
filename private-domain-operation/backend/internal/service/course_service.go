package service

import (
	"context"
	"errors"

	"private-domain-operation/backend/internal/domain"
)

var ErrCourseStoreRequired = errors.New("course store is required")

type CourseStore interface {
	GetPlayerCourse(ctx context.Context, courseID int64, userID int64) (domain.PlayerCourse, error)
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
