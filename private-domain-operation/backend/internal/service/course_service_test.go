package service

import (
	"errors"
	"testing"

	"private-domain-operation/backend/internal/domain"
)

func TestValidateCourseEditRejectsInvalidPayloads(t *testing.T) {
	t.Parallel()

	valid := domain.CourseEditPayload{
		Title:       "AIGC 视频制作",
		Description: "课程简介",
		Status:      "published",
		CoverURL:    "https://media.example.com/covers/aigc.jpg",
		Lessons: []domain.CourseEditLesson{
			{ID: 1, Title: "第 1 节", VideoURL: "https://media.example.com/video.mp4", CoverURL: "https://media.example.com/cover.jpg", DurationSeconds: 120},
		},
	}

	tests := []struct {
		name   string
		mutate func(*domain.CourseEditPayload)
	}{
		{
			name: "missing title",
			mutate: func(payload *domain.CourseEditPayload) {
				payload.Title = " "
			},
		},
		{
			name: "invalid status",
			mutate: func(payload *domain.CourseEditPayload) {
				payload.Status = "archived"
			},
		},
		{
			name: "http cover url",
			mutate: func(payload *domain.CourseEditPayload) {
				payload.CoverURL = "http://media.example.com/cover.jpg"
			},
		},
		{
			name: "http lesson video url",
			mutate: func(payload *domain.CourseEditPayload) {
				payload.Lessons[0].VideoURL = "http://media.example.com/video.mp4"
			},
		},
		{
			name: "http lesson cover url",
			mutate: func(payload *domain.CourseEditPayload) {
				payload.Lessons[0].CoverURL = "http://media.example.com/cover.jpg"
			},
		},
		{
			name: "negative lesson duration",
			mutate: func(payload *domain.CourseEditPayload) {
				payload.Lessons[0].DurationSeconds = -1
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := valid
			payload.Lessons = append([]domain.CourseEditLesson(nil), valid.Lessons...)
			tt.mutate(&payload)

			err := validateCourseEdit(payload)
			if !errors.Is(err, ErrCourseValidation) {
				t.Fatalf("validateCourseEdit error = %v, want ErrCourseValidation", err)
			}
		})
	}
}
