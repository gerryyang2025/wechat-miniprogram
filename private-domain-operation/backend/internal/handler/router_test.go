package handler

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	appdb "private-domain-operation/backend/internal/db"
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
