package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	appdb "private-domain-operation/backend/internal/db"
	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/repository"
	"private-domain-operation/backend/internal/service"
)

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

func testStudentToken(t *testing.T) string {
	t.Helper()

	auth := service.NewAuthService(service.AuthConfig{
		TokenSecret:              "test-secret",
		AllowInsecureTokenSecret: true,
	})
	token, err := auth.SignToken(domain.UserSession{
		ID:       "2",
		OpenID:   "mock-openid-user",
		Nickname: "时昕同学",
		Roles:    []string{"student"},
	})
	if err != nil {
		t.Fatalf("SignToken returned error: %v", err)
	}
	return token
}

func testRouter(t *testing.T) (*gin.Engine, *sql.DB) {
	t.Helper()

	gin.SetMode(gin.TestMode)

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
