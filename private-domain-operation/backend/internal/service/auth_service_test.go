package service

import (
	"context"
	"testing"

	"private-domain-operation/backend/internal/domain"
)

type fakeUserStore struct {
	user domain.UserSession
}

func (s *fakeUserStore) UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error) {
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

func hasRole(roles []string, target string) bool {
	for _, role := range roles {
		if role == target {
			return true
		}
	}
	return false
}
