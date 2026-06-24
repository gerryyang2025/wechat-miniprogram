package service

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"private-domain-operation/backend/internal/domain"
)

type fakeUserStore struct {
	user domain.UserSession
	err  error
}

func (s *fakeUserStore) UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error) {
	if s.err != nil {
		return domain.UserSession{}, s.err
	}
	s.user = domain.UserSession{ID: "user-1", OpenID: openID, Nickname: "微信用户", Roles: []string{"student"}}
	return s.user, nil
}

func TestAuthServiceAddsMerchantRoleFromWhitelist(t *testing.T) {
	t.Parallel()

	service := NewAuthService(AuthConfig{
		TokenSecret:     "secret",
		MerchantOpenIDs: []string{"merchant-openid"},
		CodeExchanger: func(ctx context.Context, code string) (WeChatSession, error) {
			return WeChatSession{OpenID: "merchant-openid"}, nil
		},
		Users: &fakeUserStore{},
	})

	result, err := service.LoginWithCode(context.Background(), "wx-code")
	if err != nil {
		t.Fatalf("LoginWithCode returned error: %v", err)
	}

	if result.Token == "" {
		t.Fatal("token is empty")
	}
	if !hasRole(result.User.Roles, "merchant") {
		t.Fatalf("roles = %#v", result.User.Roles)
	}

	parsed, err := service.ParseToken(result.Token)
	if err != nil {
		t.Fatalf("ParseToken returned error: %v", err)
	}
	if parsed.OpenID != "merchant-openid" {
		t.Fatalf("parsed OpenID = %q", parsed.OpenID)
	}
}

func TestAuthServiceRejectsEmptyTokenSecret(t *testing.T) {
	t.Parallel()

	service := NewAuthService(AuthConfig{TokenSecret: ""})

	_, err := service.SignToken(domain.UserSession{ID: "user-1"})
	if !errors.Is(err, ErrAuthConfig) {
		t.Fatalf("SignToken error = %v, want ErrAuthConfig", err)
	}

	_, err = service.ParseToken("body.signature")
	if !errors.Is(err, ErrAuthConfig) {
		t.Fatalf("ParseToken error = %v, want ErrAuthConfig", err)
	}
}

func TestAuthServiceRejectsDevelopmentSecretUnlessAllowed(t *testing.T) {
	t.Parallel()

	insecure := NewAuthService(AuthConfig{TokenSecret: "pdo-development-secret"})
	_, err := insecure.SignToken(domain.UserSession{ID: "user-1"})
	if !errors.Is(err, ErrAuthConfig) {
		t.Fatalf("SignToken error = %v, want ErrAuthConfig", err)
	}

	allowed := NewAuthService(AuthConfig{
		TokenSecret:              "pdo-development-secret",
		AllowInsecureTokenSecret: true,
	})
	token, err := allowed.SignToken(domain.UserSession{ID: "user-1"})
	if err != nil {
		t.Fatalf("SignToken with allowed development secret returned error: %v", err)
	}
	if token == "" {
		t.Fatal("token is empty")
	}
}

func TestAuthServiceRejectsTamperedToken(t *testing.T) {
	t.Parallel()

	service := NewAuthService(AuthConfig{TokenSecret: "secret"})
	token, err := service.SignToken(domain.UserSession{ID: "user-1", OpenID: "openid-1"})
	if err != nil {
		t.Fatalf("SignToken returned error: %v", err)
	}

	_, err = service.ParseToken(token + "tampered")
	if !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseToken error = %v, want ErrInvalidToken", err)
	}
}

func TestAuthServiceRejectsExpiredToken(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 6, 25, 10, 0, 0, 0, time.UTC)
	currentTime := now
	service := NewAuthService(AuthConfig{
		TokenSecret: "secret",
		TokenTTL:    time.Hour,
		Now: func() time.Time {
			return currentTime
		},
	})

	token, err := service.SignToken(domain.UserSession{ID: "user-1", OpenID: "openid-1"})
	if err != nil {
		t.Fatalf("SignToken returned error: %v", err)
	}

	currentTime = now.Add(2 * time.Hour)
	_, err = service.ParseToken(token)
	if !errors.Is(err, ErrTokenExpired) {
		t.Fatalf("ParseToken error = %v, want ErrTokenExpired", err)
	}
}

func TestAuthServiceRemovesMerchantRoleWhenWhitelistChanges(t *testing.T) {
	t.Parallel()

	issuer := NewAuthService(AuthConfig{
		TokenSecret:     "secret",
		MerchantOpenIDs: []string{"merchant-openid"},
	})
	token, err := issuer.SignToken(domain.UserSession{
		ID:     "user-1",
		OpenID: "merchant-openid",
		Roles:  []string{"student", "merchant"},
	})
	if err != nil {
		t.Fatalf("SignToken returned error: %v", err)
	}

	parser := NewAuthService(AuthConfig{TokenSecret: "secret"})
	parsed, err := parser.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken returned error: %v", err)
	}
	if hasRole(parsed.Roles, "merchant") {
		t.Fatalf("roles = %#v, want merchant removed", parsed.Roles)
	}
}

func TestWeChatCodeExchangerReturnsUpstreamErrorForErrCode(t *testing.T) {
	t.Parallel()

	exchanger := newWeChatCodeExchanger("wx-app", "wx-secret", "https://wechat.test/session", fakeHTTPDoerFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(strings.NewReader(`{"errcode":40029,"errmsg":"invalid code"}`)),
		}, nil
	}))
	_, err := exchanger(context.Background(), "bad-code")
	if !errors.Is(err, ErrWeChatUpstream) {
		t.Fatalf("exchange error = %v, want ErrWeChatUpstream", err)
	}
}

func TestWeChatCodeExchangerRejectsNon2xxStatus(t *testing.T) {
	t.Parallel()

	exchanger := newWeChatCodeExchanger("wx-app", "wx-secret", "https://wechat.test/session", fakeHTTPDoerFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusBadGateway,
			Body:       io.NopCloser(strings.NewReader("gateway failure with internal details")),
		}, nil
	}))
	_, err := exchanger(context.Background(), "wx-code")
	if !errors.Is(err, ErrWeChatUpstream) {
		t.Fatalf("exchange error = %v, want ErrWeChatUpstream", err)
	}
}

type fakeHTTPDoerFunc func(req *http.Request) (*http.Response, error)

func (f fakeHTTPDoerFunc) Do(req *http.Request) (*http.Response, error) {
	return f(req)
}

func hasRole(roles []string, target string) bool {
	for _, role := range roles {
		if role == target {
			return true
		}
	}
	return false
}
