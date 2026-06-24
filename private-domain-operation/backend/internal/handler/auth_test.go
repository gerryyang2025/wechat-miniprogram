package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/service"
)

type failingUserStore struct{}

func (s failingUserStore) UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error) {
	return domain.UserSession{}, errors.New("database exploded")
}

func TestHandleWechatLoginMapsMissingCodeToBadRequest(t *testing.T) {
	t.Parallel()

	recorder := postLogin(t, service.AuthConfig{
		TokenSecret: "secret",
		Users:       &fakeHandlerUserStore{},
		CodeExchanger: func(ctx context.Context, code string) (service.WeChatSession, error) {
			return service.WeChatSession{OpenID: "openid-1"}, nil
		},
	}, `{}`)

	assertLoginError(t, recorder, http.StatusBadRequest, "login code is required")
}

func TestHandleWechatLoginMapsWeChatFailureToBadGateway(t *testing.T) {
	t.Parallel()

	recorder := postLogin(t, service.AuthConfig{
		TokenSecret: "secret",
		Users:       &fakeHandlerUserStore{},
		CodeExchanger: func(ctx context.Context, code string) (service.WeChatSession, error) {
			return service.WeChatSession{}, service.ErrWeChatUpstream
		},
	}, `{"code":"wx-code"}`)

	assertLoginError(t, recorder, http.StatusBadGateway, "wechat login failed")
}

func TestHandleWechatLoginMapsUserStoreFailureToGenericServerError(t *testing.T) {
	t.Parallel()

	recorder := postLogin(t, service.AuthConfig{
		TokenSecret: "secret",
		Users:       failingUserStore{},
		CodeExchanger: func(ctx context.Context, code string) (service.WeChatSession, error) {
			return service.WeChatSession{OpenID: "openid-1"}, nil
		},
	}, `{"code":"wx-code"}`)

	assertLoginError(t, recorder, http.StatusInternalServerError, "login service unavailable")
	if strings.Contains(recorder.Body.String(), "database exploded") {
		t.Fatalf("response leaked internal error: %s", recorder.Body.String())
	}
}

type fakeHandlerUserStore struct{}

func (s *fakeHandlerUserStore) UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error) {
	return domain.UserSession{ID: "user-1", OpenID: openID, Nickname: "微信用户", Roles: []string{"student"}}, nil
}

func postLogin(t *testing.T, cfg service.AuthConfig, body string) *httptest.ResponseRecorder {
	t.Helper()

	router := gin.New()
	router.POST("/login", handleWechatLogin(Dependencies{
		Auth: service.NewAuthService(cfg),
	}))

	request := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func assertLoginError(t *testing.T, recorder *httptest.ResponseRecorder, status int, message string) {
	t.Helper()

	if recorder.Code != status {
		t.Fatalf("status = %d, want %d; body = %s", recorder.Code, status, recorder.Body.String())
	}

	var body responseBody
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON decode failed: %v", err)
	}
	if body.Message != message {
		t.Fatalf("message = %q, want %q", body.Message, message)
	}
}
