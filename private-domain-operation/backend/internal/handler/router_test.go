package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
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

func TestHomeAndLearningUseNumericLiveEntryIDs(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	for _, path := range []string{"/api/v1/home", "/api/v1/learning"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		resp := httptest.NewRecorder()

		router.ServeHTTP(resp, req)

		if resp.Code != http.StatusOK {
			t.Fatalf("%s status = %d body = %s", path, resp.Code, resp.Body.String())
		}
		body := resp.Body.String()
		if strings.Contains(body, "liveId=live-private-domain-qa") {
			t.Fatalf("%s still contains string live ID: %s", path, body)
		}
		if !strings.Contains(body, "liveId=1") {
			t.Fatalf("%s does not contain numeric seed live ID: %s", path, body)
		}
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

func TestMerchantProductsIncludesEditableCourseID(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/products?type=course", nil)
	req.Header.Set("Authorization", "Bearer "+testMerchantToken(t))
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d body = %s", resp.Code, resp.Body.String())
	}

	var body struct {
		Data struct {
			ProductList []struct {
				Title    string `json:"title"`
				CourseID string `json:"courseId"`
			} `json:"productList"`
		} `json:"data"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON decode failed: %v body = %s", err, resp.Body.String())
	}

	for _, item := range body.Data.ProductList {
		if item.Title == "AIGC 视频制作" {
			if item.CourseID != "1" {
				t.Fatalf("AIGC courseId = %q, want 1; body = %s", item.CourseID, resp.Body.String())
			}
			return
		}
	}
	t.Fatalf("AIGC product missing; body = %s", resp.Body.String())
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

func TestLiveAPIsUseSQLiteAndAccessChecks(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	list := httptest.NewRequest(http.MethodGet, "/api/v1/live-events?status=all", nil)
	listResp := httptest.NewRecorder()

	router.ServeHTTP(listResp, list)

	if listResp.Code != http.StatusOK {
		t.Fatalf("GET list status = %d body = %s", listResp.Code, listResp.Body.String())
	}
	if !strings.Contains(listResp.Body.String(), "私域运营直播答疑") {
		t.Fatalf("GET list body does not include seed live: %s", listResp.Body.String())
	}

	check := httptest.NewRequest(http.MethodPost, "/api/v1/live-events/2/access-check", strings.NewReader(`{"mode":"live"}`))
	check.Header.Set("Authorization", "Bearer "+testStudentToken(t))
	check.Header.Set("Content-Type", "application/json")
	checkResp := httptest.NewRecorder()

	router.ServeHTTP(checkResp, check)

	if checkResp.Code != http.StatusOK {
		t.Fatalf("POST access-check status = %d body = %s", checkResp.Code, checkResp.Body.String())
	}

	var body struct {
		Data struct {
			Allowed   bool   `json:"allowed"`
			TargetURL string `json:"targetUrl"`
		} `json:"data"`
	}
	if err := json.Unmarshal(checkResp.Body.Bytes(), &body); err != nil {
		t.Fatalf("access-check JSON decode failed: %v body = %s", err, checkResp.Body.String())
	}
	if !body.Data.Allowed {
		t.Fatalf("access-check allowed = false; body = %s", checkResp.Body.String())
	}
	if body.Data.TargetURL != "https://media.example.com/live/content-clinic.m3u8" {
		t.Fatalf("targetUrl = %q", body.Data.TargetURL)
	}
}

func TestLiveAccessCheckRequiresLogin(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/live-events/2/access-check", strings.NewReader(`{"mode":"live"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assertErrorCode(t, resp, http.StatusUnauthorized, 40101)
}

func TestLivePublicResponsesDoNotExposeStreamURLs(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	for _, tc := range []struct {
		name string
		path string
	}{
		{name: "list", path: "/api/v1/live-events?status=all"},
		{name: "detail", path: "/api/v1/live-events/2?mode=live"},
		{name: "room", path: "/api/v1/live-events/2/room?mode=live"},
	} {
		req := httptest.NewRequest(http.MethodGet, tc.path, nil)
		resp := httptest.NewRecorder()

		router.ServeHTTP(resp, req)

		if resp.Code != http.StatusOK {
			t.Fatalf("%s status = %d body = %s", tc.name, resp.Code, resp.Body.String())
		}
		assertLiveResponseOmitsStreams(t, responseDataRaw(t, resp))
	}
}

func TestLiveAccessDeniedOmitsTargetURL(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testTokenFor(t, domain.UserSession{
		ID:       "303",
		OpenID:   "openid-no-live-grants",
		Nickname: "No Grants",
		Roles:    []string{"student"},
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/live-events/2/access-check", strings.NewReader(`{"mode":"live"}`))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d body = %s", resp.Code, resp.Body.String())
	}
	data := responseDataRaw(t, resp)
	if strings.Contains(string(data), "targetUrl") {
		t.Fatalf("denied access response exposes targetUrl: %s", string(data))
	}
	var body struct {
		Allowed bool `json:"allowed"`
	}
	if err := json.Unmarshal(data, &body); err != nil {
		t.Fatalf("denied access data decode failed: %v data = %s", err, string(data))
	}
	if body.Allowed {
		t.Fatalf("denied access allowed = true; data = %s", string(data))
	}
}

func TestLiveRouteWithoutDependencyReturnsServiceUnavailable(t *testing.T) {
	t.Parallel()

	auth := service.NewAuthService(service.AuthConfig{
		TokenSecret:              "test-secret",
		AllowInsecureTokenSecret: true,
	})
	router := NewRouterWithDependencies(Dependencies{Auth: auth})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/live-events", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assertErrorCode(t, resp, http.StatusInternalServerError, 50004)
}

func TestMerchantLiveCreateUsesAuthenticatedMerchantMapping(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()
	insertMerchantMapping(t, conn, 2, 3)

	token := testTokenFor(t, domain.UserSession{
		ID:       "3",
		OpenID:   "mock-openid-merchant",
		Nickname: "Merchant Two",
		Roles:    []string{"merchant"},
	})
	create := httptest.NewRequest(http.MethodPost, "/api/v1/merchant/live-events", strings.NewReader(liveCreateJSON("商家二直播")))
	create.Header.Set("Authorization", "Bearer "+token)
	create.Header.Set("Content-Type", "application/json")
	createResp := httptest.NewRecorder()

	router.ServeHTTP(createResp, create)

	if createResp.Code != http.StatusOK {
		t.Fatalf("POST create status = %d body = %s", createResp.Code, createResp.Body.String())
	}
	var created struct {
		Data domain.LiveEditPayload `json:"data"`
	}
	if err := json.Unmarshal(createResp.Body.Bytes(), &created); err != nil {
		t.Fatalf("create JSON decode failed: %v body = %s", err, createResp.Body.String())
	}

	var merchantID int64
	if err := conn.QueryRowContext(context.Background(), `SELECT merchant_id FROM live_events WHERE id = ?`, created.Data.ID).Scan(&merchantID); err != nil {
		t.Fatalf("created merchant query returned error: %v", err)
	}
	if merchantID != 2 {
		t.Fatalf("created merchant_id = %d, want 2", merchantID)
	}
}

func TestMerchantLiveCreateEditAndValidation(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testMerchantToken(t)
	createBody := `{
		"title":"新增直播：私域转化复盘",
		"summary":"复盘私域转化关键动作。",
		"speaker":"Gerry",
		"coverUrl":"https://media.example.com/covers/live/new-session.jpg",
		"startAt":"2026-06-28T20:00:00+08:00",
		"endAt":"2026-06-28T21:00:00+08:00",
		"statusOverride":"upcoming",
		"liveUrl":"https://media.example.com/live/new-session.m3u8",
		"replayUrl":"https://media.example.com/replay/new-session.mp4",
		"visibility":"course",
		"visibilityRefId":1,
		"replayEnabled":true
	}`
	create := httptest.NewRequest(http.MethodPost, "/api/v1/merchant/live-events", strings.NewReader(createBody))
	create.Header.Set("Authorization", "Bearer "+token)
	create.Header.Set("Content-Type", "application/json")
	createResp := httptest.NewRecorder()

	router.ServeHTTP(createResp, create)

	if createResp.Code != http.StatusOK {
		t.Fatalf("POST create status = %d body = %s", createResp.Code, createResp.Body.String())
	}

	var createdBody struct {
		Data domain.LiveEditPayload `json:"data"`
	}
	if err := json.Unmarshal(createResp.Body.Bytes(), &createdBody); err != nil {
		t.Fatalf("create JSON decode failed: %v body = %s", err, createResp.Body.String())
	}
	if createdBody.Data.ID == 0 {
		t.Fatalf("created live ID = 0; body = %s", createResp.Body.String())
	}

	getEdit := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/merchant/live-events/%d/edit", createdBody.Data.ID), nil)
	getEdit.Header.Set("Authorization", "Bearer "+token)
	getEditResp := httptest.NewRecorder()

	router.ServeHTTP(getEditResp, getEdit)

	if getEditResp.Code != http.StatusOK {
		t.Fatalf("GET edit status = %d body = %s", getEditResp.Code, getEditResp.Body.String())
	}

	var editBody struct {
		Data domain.LiveEditPayload `json:"data"`
	}
	if err := json.Unmarshal(getEditResp.Body.Bytes(), &editBody); err != nil {
		t.Fatalf("edit JSON decode failed: %v body = %s", err, getEditResp.Body.String())
	}
	if editBody.Data.Title != "新增直播：私域转化复盘" {
		t.Fatalf("edit title = %q", editBody.Data.Title)
	}

	validUpdate := `{
		"title":"新增直播：私域转化复盘 - 更新",
		"summary":"更新后的直播复盘说明。",
		"speaker":"Gerry",
		"coverUrl":"https://media.example.com/covers/live/new-session-updated.jpg",
		"startAt":"2026-06-28T20:30:00+08:00",
		"endAt":"2026-06-28T21:30:00+08:00",
		"statusOverride":"upcoming",
		"liveUrl":"https://media.example.com/live/new-session-updated.m3u8",
		"replayUrl":"https://media.example.com/replay/new-session-updated.mp4",
		"visibility":"all",
		"visibilityRefId":0,
		"replayEnabled":false
	}`
	validPut := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/merchant/live-events/%d", createdBody.Data.ID), strings.NewReader(validUpdate))
	validPut.Header.Set("Authorization", "Bearer "+token)
	validPut.Header.Set("Content-Type", "application/json")
	validPutResp := httptest.NewRecorder()

	router.ServeHTTP(validPutResp, validPut)

	if validPutResp.Code != http.StatusOK {
		t.Fatalf("valid PUT status = %d body = %s", validPutResp.Code, validPutResp.Body.String())
	}

	var validUpdateBody struct {
		Data domain.LiveEditPayload `json:"data"`
	}
	if err := json.Unmarshal(validPutResp.Body.Bytes(), &validUpdateBody); err != nil {
		t.Fatalf("valid PUT JSON decode failed: %v body = %s", err, validPutResp.Body.String())
	}
	if validUpdateBody.Data.ID != createdBody.Data.ID {
		t.Fatalf("valid PUT id = %d, want %d", validUpdateBody.Data.ID, createdBody.Data.ID)
	}
	if validUpdateBody.Data.Title != "新增直播：私域转化复盘 - 更新" {
		t.Fatalf("valid PUT title = %q", validUpdateBody.Data.Title)
	}
	if validUpdateBody.Data.Visibility != "all" || validUpdateBody.Data.VisibilityRefID != 0 {
		t.Fatalf("valid PUT visibility = %q ref = %d", validUpdateBody.Data.Visibility, validUpdateBody.Data.VisibilityRefID)
	}

	getUpdated := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/merchant/live-events/%d/edit", createdBody.Data.ID), nil)
	getUpdated.Header.Set("Authorization", "Bearer "+token)
	getUpdatedResp := httptest.NewRecorder()

	router.ServeHTTP(getUpdatedResp, getUpdated)

	if getUpdatedResp.Code != http.StatusOK {
		t.Fatalf("GET updated edit status = %d body = %s", getUpdatedResp.Code, getUpdatedResp.Body.String())
	}

	var updatedEditBody struct {
		Data domain.LiveEditPayload `json:"data"`
	}
	if err := json.Unmarshal(getUpdatedResp.Body.Bytes(), &updatedEditBody); err != nil {
		t.Fatalf("GET updated edit JSON decode failed: %v body = %s", err, getUpdatedResp.Body.String())
	}
	if updatedEditBody.Data.Title != "新增直播：私域转化复盘 - 更新" {
		t.Fatalf("updated edit title = %q", updatedEditBody.Data.Title)
	}
	if updatedEditBody.Data.LiveURL != "https://media.example.com/live/new-session-updated.m3u8" {
		t.Fatalf("updated edit live URL = %q", updatedEditBody.Data.LiveURL)
	}
	if updatedEditBody.Data.ReplayEnabled {
		t.Fatalf("updated edit replayEnabled = true, want false")
	}

	invalidUpdate := `{
		"title":"新增直播：私域转化复盘",
		"summary":"复盘私域转化关键动作。",
		"speaker":"Gerry",
		"coverUrl":"https://media.example.com/covers/live/new-session.jpg",
		"startAt":"2026-06-28T20:00:00+08:00",
		"endAt":"2026-06-28T21:00:00+08:00",
		"statusOverride":"upcoming",
		"liveUrl":"http://media.example.com/live/new-session.m3u8",
		"replayUrl":"https://media.example.com/replay/new-session.mp4",
		"visibility":"course",
		"visibilityRefId":1,
		"replayEnabled":true
	}`
	put := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/merchant/live-events/%d", createdBody.Data.ID), strings.NewReader(invalidUpdate))
	put.Header.Set("Authorization", "Bearer "+token)
	put.Header.Set("Content-Type", "application/json")
	putResp := httptest.NewRecorder()

	router.ServeHTTP(putResp, put)

	assertErrorCode(t, putResp, http.StatusBadRequest, 40004)
}

func TestMerchantLiveListEditAndUpdateAreScoped(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()
	otherLiveID := insertOtherMerchantLiveEvent(t, conn)

	token := testMerchantToken(t)
	list := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/live-events?status=all", nil)
	list.Header.Set("Authorization", "Bearer "+token)
	listResp := httptest.NewRecorder()

	router.ServeHTTP(listResp, list)

	if listResp.Code != http.StatusOK {
		t.Fatalf("GET list status = %d body = %s", listResp.Code, listResp.Body.String())
	}
	if strings.Contains(listResp.Body.String(), "其他商家直播") {
		t.Fatalf("merchant list leaked other merchant live: %s", listResp.Body.String())
	}

	getEdit := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/merchant/live-events/%d/edit", otherLiveID), nil)
	getEdit.Header.Set("Authorization", "Bearer "+token)
	getEditResp := httptest.NewRecorder()

	router.ServeHTTP(getEditResp, getEdit)

	assertErrorCode(t, getEditResp, http.StatusNotFound, 40404)

	put := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/merchant/live-events/%d", otherLiveID), strings.NewReader(liveCreateJSON("尝试更新其他商家直播")))
	put.Header.Set("Authorization", "Bearer "+token)
	put.Header.Set("Content-Type", "application/json")
	putResp := httptest.NewRecorder()

	router.ServeHTTP(putResp, put)

	assertErrorCode(t, putResp, http.StatusNotFound, 40404)
}

func TestMerchantLiveRoutesRequireMerchantMapping(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	token := testTokenFor(t, domain.UserSession{
		ID:       "303",
		OpenID:   "mock-openid-merchant",
		Nickname: "No Mapping",
		Roles:    []string{"merchant"},
	})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/access-options", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assertErrorCode(t, resp, http.StatusForbidden, 40301)
}

func TestMerchantLiveAccessOptionsAreScoped(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()
	insertOtherMerchantAccessContent(t, conn)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/merchant/access-options", nil)
	req.Header.Set("Authorization", "Bearer "+testMerchantToken(t))
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d body = %s", resp.Code, resp.Body.String())
	}
	body := resp.Body.String()
	if !strings.Contains(body, "AIGC 视频制作") {
		t.Fatalf("access options missing seed course: %s", body)
	}
	if strings.Contains(body, "其他商家课程") || strings.Contains(body, "其他商家训练营") {
		t.Fatalf("access options leaked other merchant content: %s", body)
	}
}

func TestLiveDetailEscapesTitleInGeneratedEntries(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	title := "直播标题 A&B?x=1"
	create := httptest.NewRequest(http.MethodPost, "/api/v1/merchant/live-events", strings.NewReader(liveCreateJSON(title)))
	create.Header.Set("Authorization", "Bearer "+testMerchantToken(t))
	create.Header.Set("Content-Type", "application/json")
	createResp := httptest.NewRecorder()

	router.ServeHTTP(createResp, create)

	if createResp.Code != http.StatusOK {
		t.Fatalf("POST create status = %d body = %s", createResp.Code, createResp.Body.String())
	}
	var created struct {
		Data domain.LiveEditPayload `json:"data"`
	}
	if err := json.Unmarshal(createResp.Body.Bytes(), &created); err != nil {
		t.Fatalf("create JSON decode failed: %v body = %s", err, createResp.Body.String())
	}

	detail := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/live-events/%d?mode=live", created.Data.ID), nil)
	detailResp := httptest.NewRecorder()

	router.ServeHTTP(detailResp, detail)

	if detailResp.Code != http.StatusOK {
		t.Fatalf("GET detail status = %d body = %s", detailResp.Code, detailResp.Body.String())
	}
	var body struct {
		Data struct {
			PrimaryEntry struct {
				URL string `json:"url"`
			} `json:"primaryEntry"`
			SecondaryEntry struct {
				URL string `json:"url"`
			} `json:"secondaryEntry"`
		} `json:"data"`
	}
	if err := json.Unmarshal(detailResp.Body.Bytes(), &body); err != nil {
		t.Fatalf("detail JSON decode failed: %v body = %s", err, detailResp.Body.String())
	}
	for _, gotURL := range []string{body.Data.PrimaryEntry.URL, body.Data.SecondaryEntry.URL} {
		if strings.Contains(gotURL, "title="+title) {
			t.Fatalf("entry URL contains raw title delimiters: %s", gotURL)
		}
		if !strings.Contains(gotURL, "title=%E7%9B%B4%E6%92%AD%E6%A0%87%E9%A2%98+A%26B%3Fx%3D1") {
			t.Fatalf("entry URL does not contain escaped title: %s", gotURL)
		}
	}
}

func TestLiveAPIErrorBusinessCodes(t *testing.T) {
	t.Parallel()

	router, conn := testRouter(t)
	defer conn.Close()

	invalid := httptest.NewRequest(http.MethodGet, "/api/v1/live-events/not-a-number", nil)
	invalidResp := httptest.NewRecorder()

	router.ServeHTTP(invalidResp, invalid)

	assertErrorCode(t, invalidResp, http.StatusBadRequest, 40003)

	missing := httptest.NewRequest(http.MethodGet, "/api/v1/live-events/999", nil)
	missingResp := httptest.NewRecorder()

	router.ServeHTTP(missingResp, missing)

	assertErrorCode(t, missingResp, http.StatusNotFound, 40404)

	create := httptest.NewRequest(http.MethodPost, "/api/v1/merchant/live-events", strings.NewReader(`{"title":"学生不能创建"}`))
	create.Header.Set("Authorization", "Bearer "+testStudentToken(t))
	create.Header.Set("Content-Type", "application/json")
	createResp := httptest.NewRecorder()

	router.ServeHTTP(createResp, create)

	assertErrorCode(t, createResp, http.StatusForbidden, 40301)
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

func responseDataRaw(t *testing.T, resp *httptest.ResponseRecorder) json.RawMessage {
	t.Helper()

	var body struct {
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON decode failed: %v body = %s", err, resp.Body.String())
	}
	return body.Data
}

func assertLiveResponseOmitsStreams(t *testing.T, data json.RawMessage) {
	t.Helper()

	raw := string(data)
	for _, forbidden := range []string{
		"targetUrl",
		"https://media.example.com/live/private-domain-qa.m3u8",
		"https://media.example.com/live/content-clinic.m3u8",
		"https://media.example.com/live/bootcamp-review.m3u8",
		"https://media.example.com/replay/private-domain-qa.mp4",
		"https://media.example.com/replay/bootcamp-review.mp4",
	} {
		if strings.Contains(raw, forbidden) {
			t.Fatalf("public live response exposes %q: %s", forbidden, raw)
		}
	}
}

func liveCreateJSON(title string) string {
	return fmt.Sprintf(`{
		"title":%q,
		"summary":"复盘私域转化关键动作。",
		"speaker":"Gerry",
		"coverUrl":"https://media.example.com/covers/live/new-session.jpg",
		"startAt":"2026-06-28T20:00:00+08:00",
		"endAt":"2026-06-28T21:00:00+08:00",
		"statusOverride":"upcoming",
		"liveUrl":"https://media.example.com/live/new-session.m3u8",
		"replayUrl":"https://media.example.com/replay/new-session.mp4",
		"visibility":"course",
		"visibilityRefId":1,
		"replayEnabled":true
	}`, title)
}

func insertMerchantMapping(t *testing.T, conn *sql.DB, merchantID int64, userID int64) {
	t.Helper()

	ctx := context.Background()
	if _, err := conn.ExecContext(ctx, `INSERT INTO merchants (id, name, intro, status) VALUES (?, ?, ?, 'active')`, merchantID, fmt.Sprintf("商家 %d", merchantID), "测试商家"); err != nil {
		t.Fatalf("insert merchant returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO users (id, openid, nickname, status) VALUES (?, ?, ?, 'active')`, userID, fmt.Sprintf("openid-merchant-%d", userID), fmt.Sprintf("商家用户 %d", userID)); err != nil {
		t.Fatalf("insert merchant user returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO merchant_users (merchant_id, user_id, role_key, status) VALUES (?, ?, 'owner', 'active')`, merchantID, userID); err != nil {
		t.Fatalf("insert merchant mapping returned error: %v", err)
	}
}

func insertOtherMerchantLiveEvent(t *testing.T, conn *sql.DB) int64 {
	t.Helper()

	ctx := context.Background()
	if _, err := conn.ExecContext(ctx, `INSERT INTO merchants (id, name, intro, status) VALUES (2, '其他商家', '测试隔离商家', 'active')`); err != nil {
		t.Fatalf("insert other merchant returned error: %v", err)
	}
	result, err := conn.ExecContext(ctx, `
		INSERT INTO live_events (
			merchant_id, title, summary, speaker, cover_url, start_at, end_at,
			status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled
		)
		VALUES (
			2, '其他商家直播', '不应出现在种子商家列表。', 'Other',
			'https://media.example.com/covers/live/other.jpg',
			'2026-06-29T20:00:00+08:00',
			'2026-06-29T21:00:00+08:00',
			'upcoming', 'upcoming',
			'https://media.example.com/live/other.m3u8',
			'', 'all', NULL, 0
		)
	`)
	if err != nil {
		t.Fatalf("insert other merchant live returned error: %v", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		t.Fatalf("other merchant live id returned error: %v", err)
	}
	return id
}

func insertOtherMerchantAccessContent(t *testing.T, conn *sql.DB) {
	t.Helper()

	ctx := context.Background()
	if _, err := conn.ExecContext(ctx, `INSERT INTO merchants (id, name, intro, status) VALUES (20, '其他商家', '测试隔离商家', 'active')`); err != nil {
		t.Fatalf("insert other merchant returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO products (id, merchant_id, product_type, title, status) VALUES (20, 20, 'course', '其他商家课程商品', 'published')`); err != nil {
		t.Fatalf("insert other merchant course product returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO courses (id, product_id, merchant_id, title, description, status) VALUES (20, 20, 20, '其他商家课程', '不应泄漏到商家 1。', 'published')`); err != nil {
		t.Fatalf("insert other merchant course returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO products (id, merchant_id, product_type, title, status) VALUES (21, 20, 'bootcamp', '其他商家训练营商品', 'published')`); err != nil {
		t.Fatalf("insert other merchant bootcamp product returned error: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `INSERT INTO bootcamps (id, product_id, merchant_id, title, subtitle, total_days, status) VALUES (20, 21, 20, '其他商家训练营', '不应泄漏到商家 1。', 7, 'active')`); err != nil {
		t.Fatalf("insert other merchant bootcamp returned error: %v", err)
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
		Live:     service.NewLiveService(repository.NewLiveRepository(conn)),
		Progress: service.NewProgressService(repository.NewProgressRepository(conn)),
	}

	return NewRouterWithDependencies(deps), conn
}
