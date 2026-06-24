package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	appdb "private-domain-operation/backend/internal/db"
	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/repository"
	"private-domain-operation/backend/internal/service"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	os.Exit(m.Run())
}

func TestHomeUsesSeedCourse(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/home", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d body = %s", resp.Code, resp.Body.String())
	}
	if !strings.Contains(resp.Body.String(), "AIGC 视频制作") {
		t.Fatalf("body does not include seed course: %s", resp.Body.String())
	}
}

func TestSeedProgressReturnsPersistedSeconds(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testStudentToken(t)
	post := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/learning/courses/player-aigc-video/progress",
		strings.NewReader(`{"lesson_id":"player-aigc-l2","progress_seconds":42,"completed":false}`),
	)
	post.Header.Set("Authorization", "Bearer "+token)
	post.Header.Set("Content-Type", "application/json")
	postResp := httptest.NewRecorder()

	router.ServeHTTP(postResp, post)

	if postResp.Code != http.StatusOK {
		t.Fatalf("POST status = %d body = %s", postResp.Code, postResp.Body.String())
	}

	get := httptest.NewRequest(http.MethodGet, "/api/v1/learning/courses/player-aigc-video/progress", nil)
	get.Header.Set("Authorization", "Bearer "+token)
	getResp := httptest.NewRecorder()

	router.ServeHTTP(getResp, get)

	if getResp.Code != http.StatusOK {
		t.Fatalf("GET status = %d body = %s", getResp.Code, getResp.Body.String())
	}

	var body struct {
		Data struct {
			ProgressSeconds int `json:"progress_seconds"`
		} `json:"data"`
	}
	if err := json.Unmarshal(getResp.Body.Bytes(), &body); err != nil {
		t.Fatalf("GET response JSON decode failed: %v body = %s", err, getResp.Body.String())
	}
	if body.Data.ProgressSeconds != 42 {
		t.Fatalf("progress_seconds = %d, want 42; body = %s", body.Data.ProgressSeconds, getResp.Body.String())
	}
}

func TestSeedProgressRejectsNonnumericDBUserToken(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testTokenFor(t, domain.UserSession{
		ID:       "transient-user-1",
		OpenID:   "openid-transient-user",
		Nickname: "Transient User",
		Roles:    []string{"student"},
	})

	post := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/learning/courses/player-aigc-video/progress",
		strings.NewReader(`{"lesson_id":"player-aigc-l2","progress_seconds":42,"completed":false}`),
	)
	post.Header.Set("Authorization", "Bearer "+token)
	post.Header.Set("Content-Type", "application/json")
	postResp := httptest.NewRecorder()

	router.ServeHTTP(postResp, post)

	assertErrorCode(t, postResp, http.StatusUnauthorized, 40102)

	get := httptest.NewRequest(http.MethodGet, "/api/v1/learning/courses/player-aigc-video/progress", nil)
	get.Header.Set("Authorization", "Bearer "+token)
	getResp := httptest.NewRecorder()

	router.ServeHTTP(getResp, get)

	assertErrorCode(t, getResp, http.StatusUnauthorized, 40102)

	var lessonID int64
	var completedLessons int
	var progressSeconds int
	if err := conn.QueryRowContext(context.Background(), `
		SELECT lesson_id, completed_lessons, progress_seconds
		FROM learning_progress
		WHERE user_id = 2 AND course_id = 1
	`).Scan(&lessonID, &completedLessons, &progressSeconds); err != nil {
		t.Fatalf("seed progress query returned error: %v", err)
	}
	if lessonID != 1 {
		t.Fatalf("seed user lesson id = %d, want unchanged 1", lessonID)
	}
	if completedLessons != 0 {
		t.Fatalf("seed user completed lessons = %d, want unchanged 0", completedLessons)
	}
	if progressSeconds != 0 {
		t.Fatalf("seed user progress seconds = %d, want unchanged 0", progressSeconds)
	}
}

func TestFallbackProgressIsScopedByAuthenticatedUser(t *testing.T) {
	router, conn := testRouter(t)
	defer conn.Close()

	userAToken := testTokenFor(t, domain.UserSession{
		ID:       "101",
		OpenID:   "openid-user-a",
		Nickname: "User A",
		Roles:    []string{"student"},
	})
	userBToken := testTokenFor(t, domain.UserSession{
		ID:       "202",
		OpenID:   "openid-user-b",
		Nickname: "User B",
		Roles:    []string{"student"},
	})

	post := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/learning/courses/player-ip-course/progress",
		strings.NewReader(`{"lesson_id":"player-ip-l2","progress_seconds":321,"completed":false}`),
	)
	post.Header.Set("Authorization", "Bearer "+userAToken)
	post.Header.Set("Content-Type", "application/json")
	postResp := httptest.NewRecorder()

	router.ServeHTTP(postResp, post)

	if postResp.Code != http.StatusOK {
		t.Fatalf("POST status = %d body = %s", postResp.Code, postResp.Body.String())
	}

	get := httptest.NewRequest(http.MethodGet, "/api/v1/learning/courses/player-ip-course/progress", nil)
	get.Header.Set("Authorization", "Bearer "+userBToken)
	getResp := httptest.NewRecorder()

	router.ServeHTTP(getResp, get)

	if getResp.Code != http.StatusOK {
		t.Fatalf("GET status = %d body = %s", getResp.Code, getResp.Body.String())
	}

	var body struct {
		Data struct {
			LessonID        string `json:"lesson_id"`
			ProgressSeconds int    `json:"progress_seconds"`
		} `json:"data"`
	}
	if err := json.Unmarshal(getResp.Body.Bytes(), &body); err != nil {
		t.Fatalf("GET response JSON decode failed: %v body = %s", err, getResp.Body.String())
	}
	if body.Data.ProgressSeconds == 321 {
		t.Fatalf("user B saw user A progress seconds; body = %s", getResp.Body.String())
	}
	if body.Data.LessonID == "player-ip-l2" {
		t.Fatalf("user B saw user A lesson; body = %s", getResp.Body.String())
	}
}

func TestMerchantCourseEditUpdateAndAnalytics(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testMerchantToken(t)

	getEdit := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/1/edit", nil)
	getEdit.Header.Set("Authorization", "Bearer "+token)
	getEditResp := httptest.NewRecorder()

	router.ServeHTTP(getEditResp, getEdit)

	if getEditResp.Code != http.StatusOK {
		t.Fatalf("GET edit status = %d body = %s", getEditResp.Code, getEditResp.Body.String())
	}

	var editBody struct {
		Data struct {
			Title   string `json:"title"`
			Lessons []struct {
				ID       int64  `json:"id"`
				VideoURL string `json:"videoUrl"`
			} `json:"lessons"`
		} `json:"data"`
	}
	if err := json.Unmarshal(getEditResp.Body.Bytes(), &editBody); err != nil {
		t.Fatalf("GET edit JSON decode failed: %v body = %s", err, getEditResp.Body.String())
	}
	if editBody.Data.Title != "AIGC 视频制作" {
		t.Fatalf("GET edit title = %q", editBody.Data.Title)
	}
	if len(editBody.Data.Lessons) != 3 {
		t.Fatalf("GET edit lessons = %d", len(editBody.Data.Lessons))
	}

	updateBody := `{
		"title":"AIGC 视频制作 - 联调版",
		"description":"更新后的课程简介",
		"status":"draft",
		"coverUrl":"https://media.example.com/covers/aigc/new-cover.jpg",
		"lessons":[
			{
				"id":2,
				"title":"第 2 节 AIGC 视频脚本拆解 - 更新",
				"videoUrl":"https://media.example.com/courses/aigc/lesson-002-updated.mp4",
				"coverUrl":"https://media.example.com/covers/aigc/lesson-002.jpg",
				"durationSeconds":333
			}
		]
	}`
	put := httptest.NewRequest(http.MethodPut, "/api/v1/merchant/courses/1", strings.NewReader(updateBody))
	put.Header.Set("Authorization", "Bearer "+token)
	put.Header.Set("Content-Type", "application/json")
	putResp := httptest.NewRecorder()

	router.ServeHTTP(putResp, put)

	if putResp.Code != http.StatusOK {
		t.Fatalf("PUT status = %d body = %s", putResp.Code, putResp.Body.String())
	}

	getUpdated := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/1/edit", nil)
	getUpdated.Header.Set("Authorization", "Bearer "+token)
	getUpdatedResp := httptest.NewRecorder()

	router.ServeHTTP(getUpdatedResp, getUpdated)

	if getUpdatedResp.Code != http.StatusOK {
		t.Fatalf("GET updated status = %d body = %s", getUpdatedResp.Code, getUpdatedResp.Body.String())
	}

	var updatedBody struct {
		Data struct {
			Title   string                     `json:"title"`
			Status  string                     `json:"status"`
			Lessons []courseEditLessonResponse `json:"lessons"`
		} `json:"data"`
	}
	if err := json.Unmarshal(getUpdatedResp.Body.Bytes(), &updatedBody); err != nil {
		t.Fatalf("GET updated JSON decode failed: %v body = %s", err, getUpdatedResp.Body.String())
	}
	if updatedBody.Data.Title != "AIGC 视频制作 - 联调版" {
		t.Fatalf("updated title = %q", updatedBody.Data.Title)
	}
	if updatedBody.Data.Status != "draft" {
		t.Fatalf("updated status = %q", updatedBody.Data.Status)
	}
	lesson, ok := findLesson(updatedBody.Data.Lessons, 2)
	if !ok {
		t.Fatalf("updated lesson 2 missing: %#v", updatedBody.Data.Lessons)
	}
	if lesson.Title != "第 2 节 AIGC 视频脚本拆解 - 更新" {
		t.Fatalf("updated lesson title = %q", lesson.Title)
	}
	if lesson.VideoURL != "https://media.example.com/courses/aigc/lesson-002-updated.mp4" {
		t.Fatalf("updated lesson video URL = %q", lesson.VideoURL)
	}
	if lesson.DurationSeconds != 333 {
		t.Fatalf("updated lesson duration = %d", lesson.DurationSeconds)
	}

	analytics := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/1/analytics", nil)
	analytics.Header.Set("Authorization", "Bearer "+token)
	analyticsResp := httptest.NewRecorder()

	router.ServeHTTP(analyticsResp, analytics)

	if analyticsResp.Code != http.StatusOK {
		t.Fatalf("GET analytics status = %d body = %s", analyticsResp.Code, analyticsResp.Body.String())
	}

	var analyticsBody struct {
		Data domain.CourseAnalytics `json:"data"`
	}
	if err := json.Unmarshal(analyticsResp.Body.Bytes(), &analyticsBody); err != nil {
		t.Fatalf("GET analytics JSON decode failed: %v body = %s", err, analyticsResp.Body.String())
	}
	if analyticsBody.Data.LearnerCount != 1 {
		t.Fatalf("learnerCount = %d", analyticsBody.Data.LearnerCount)
	}
}

func TestMerchantCoursePartialLessonUpdatePreservesMedia(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testMerchantToken(t)

	getEdit := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/1/edit", nil)
	getEdit.Header.Set("Authorization", "Bearer "+token)
	getEditResp := httptest.NewRecorder()

	router.ServeHTTP(getEditResp, getEdit)

	if getEditResp.Code != http.StatusOK {
		t.Fatalf("GET edit status = %d body = %s", getEditResp.Code, getEditResp.Body.String())
	}

	var originalBody struct {
		Data struct {
			Lessons []courseEditLessonResponse `json:"lessons"`
		} `json:"data"`
	}
	if err := json.Unmarshal(getEditResp.Body.Bytes(), &originalBody); err != nil {
		t.Fatalf("GET edit JSON decode failed: %v body = %s", err, getEditResp.Body.String())
	}
	originalLesson, ok := findLesson(originalBody.Data.Lessons, 2)
	if !ok {
		t.Fatalf("original lesson 2 missing: %#v", originalBody.Data.Lessons)
	}

	updateBody := `{
		"title":"AIGC 视频制作",
		"description":"从脚本构思、口播表达，到成片剪辑与发布节奏。",
		"status":"published",
		"coverUrl":"https://media.example.com/covers/aigc/lesson-001.jpg",
		"lessons":[
			{
				"id":2,
				"title":"第 2 节 AIGC 视频脚本拆解 - 标题更新"
			}
		]
	}`
	put := httptest.NewRequest(http.MethodPut, "/api/v1/merchant/courses/1", strings.NewReader(updateBody))
	put.Header.Set("Authorization", "Bearer "+token)
	put.Header.Set("Content-Type", "application/json")
	putResp := httptest.NewRecorder()

	router.ServeHTTP(putResp, put)

	if putResp.Code != http.StatusOK {
		t.Fatalf("PUT status = %d body = %s", putResp.Code, putResp.Body.String())
	}

	getUpdated := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/1/edit", nil)
	getUpdated.Header.Set("Authorization", "Bearer "+token)
	getUpdatedResp := httptest.NewRecorder()

	router.ServeHTTP(getUpdatedResp, getUpdated)

	if getUpdatedResp.Code != http.StatusOK {
		t.Fatalf("GET updated status = %d body = %s", getUpdatedResp.Code, getUpdatedResp.Body.String())
	}

	var updatedBody struct {
		Data struct {
			Lessons []courseEditLessonResponse `json:"lessons"`
		} `json:"data"`
	}
	if err := json.Unmarshal(getUpdatedResp.Body.Bytes(), &updatedBody); err != nil {
		t.Fatalf("GET updated JSON decode failed: %v body = %s", err, getUpdatedResp.Body.String())
	}
	updatedLesson, ok := findLesson(updatedBody.Data.Lessons, 2)
	if !ok {
		t.Fatalf("updated lesson 2 missing: %#v", updatedBody.Data.Lessons)
	}
	if updatedLesson.Title != "第 2 节 AIGC 视频脚本拆解 - 标题更新" {
		t.Fatalf("updated lesson title = %q", updatedLesson.Title)
	}
	if updatedLesson.VideoURL != originalLesson.VideoURL {
		t.Fatalf("updated lesson video URL = %q, want %q", updatedLesson.VideoURL, originalLesson.VideoURL)
	}
	if updatedLesson.CoverURL != originalLesson.CoverURL {
		t.Fatalf("updated lesson cover URL = %q, want %q", updatedLesson.CoverURL, originalLesson.CoverURL)
	}
	if updatedLesson.DurationSeconds != originalLesson.DurationSeconds {
		t.Fatalf("updated lesson duration = %d, want %d", updatedLesson.DurationSeconds, originalLesson.DurationSeconds)
	}
}

func TestMerchantCourseUpdateValidationErrorUsesBusinessCode(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testMerchantToken(t)
	put := httptest.NewRequest(
		http.MethodPut,
		"/api/v1/merchant/courses/1",
		strings.NewReader(`{"title":"AIGC 视频制作","status":"published","coverUrl":"https://media.example.com/cover.jpg","lessons":[{"id":1,"title":"第 1 节","videoUrl":"http://media.example.com/video.mp4","durationSeconds":120}]}`),
	)
	put.Header.Set("Authorization", "Bearer "+token)
	put.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, put)

	assertErrorCode(t, resp, http.StatusBadRequest, 40004)
}

func TestMerchantCourseInvalidAndMissingIDsUseBusinessCodes(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testMerchantToken(t)

	invalid := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/not-a-number/edit", nil)
	invalid.Header.Set("Authorization", "Bearer "+token)
	invalidResp := httptest.NewRecorder()

	router.ServeHTTP(invalidResp, invalid)

	assertErrorCode(t, invalidResp, http.StatusBadRequest, 40003)

	missing := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/courses/999/edit", nil)
	missing.Header.Set("Authorization", "Bearer "+token)
	missingResp := httptest.NewRecorder()

	router.ServeHTTP(missingResp, missing)

	assertErrorCode(t, missingResp, http.StatusNotFound, 40404)
}

func testStudentToken(t *testing.T) string {
	t.Helper()

	return testTokenFor(t, domain.UserSession{
		ID:       "2",
		OpenID:   "mock-openid-user",
		Nickname: "时昕同学",
		Roles:    []string{"student"},
	})
}

func testMerchantToken(t *testing.T) string {
	t.Helper()

	return testTokenFor(t, domain.UserSession{
		ID:       "1",
		OpenID:   "mock-openid-merchant",
		Nickname: "Gerry",
		Roles:    []string{"student", "merchant"},
	})
}

func testTokenFor(t *testing.T, user domain.UserSession) string {
	t.Helper()

	auth := service.NewAuthService(service.AuthConfig{
		TokenSecret:              "test-secret",
		AllowInsecureTokenSecret: true,
		MerchantOpenIDs:          []string{"mock-openid-merchant"},
	})
	token, err := auth.SignToken(user)
	if err != nil {
		t.Fatalf("SignToken returned error: %v", err)
	}
	return token
}

type courseEditLessonResponse struct {
	ID              int64  `json:"id"`
	Title           string `json:"title"`
	VideoURL        string `json:"videoUrl"`
	CoverURL        string `json:"coverUrl"`
	DurationSeconds int    `json:"durationSeconds"`
}

func findLesson(lessons []courseEditLessonResponse, id int64) (courseEditLessonResponse, bool) {
	for _, lesson := range lessons {
		if lesson.ID == id {
			return lesson, true
		}
	}
	return courseEditLessonResponse{}, false
}

func assertErrorCode(t *testing.T, resp *httptest.ResponseRecorder, status int, code int) {
	t.Helper()

	if resp.Code != status {
		t.Fatalf("status = %d, want %d; body = %s", resp.Code, status, resp.Body.String())
	}

	var body responseBody
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON decode failed: %v body = %s", err, resp.Body.String())
	}
	if body.Code != code {
		t.Fatalf("code = %d, want %d; body = %s", body.Code, code, resp.Body.String())
	}
}

func testRouter(t *testing.T) (*gin.Engine, *sql.DB) {
	t.Helper()

	ctx := context.Background()
	conn, err := appdb.Open(filepath.Join(t.TempDir(), "pdo.db"))
	if err != nil {
		t.Fatalf("Open returned error: %v", err)
	}
	if err := appdb.Migrate(ctx, conn, filepath.Join("..", "..", "migrations")); err != nil {
		t.Fatalf("Migrate returned error: %v", err)
	}
	if err := appdb.SeedMinimal(ctx, conn, appdb.SeedOptions{}); err != nil {
		t.Fatalf("SeedMinimal returned error: %v", err)
	}

	users := repository.NewUserRepository(conn)
	auth := service.NewAuthService(service.AuthConfig{
		TokenSecret:              "test-secret",
		AllowInsecureTokenSecret: true,
		MerchantOpenIDs:          []string{"mock-openid-merchant"},
		Users:                    users,
		CodeExchanger: func(ctx context.Context, code string) (service.WeChatSession, error) {
			return service.WeChatSession{OpenID: "mock-openid-user"}, nil
		},
	})

	deps := Dependencies{
		Auth:     auth,
		Courses:  service.NewCourseService(repository.NewCourseRepository(conn)),
		Progress: service.NewProgressService(repository.NewProgressRepository(conn)),
	}

	return NewRouterWithDependencies(deps), conn
}
