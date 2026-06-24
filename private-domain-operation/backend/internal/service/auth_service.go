package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"private-domain-operation/backend/internal/domain"
)

type UserStore interface {
	UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error)
}

type WeChatSession struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

type CodeExchanger func(ctx context.Context, code string) (WeChatSession, error)

type AuthConfig struct {
	AppID           string
	AppSecret       string
	TokenSecret     string
	MerchantOpenIDs []string
	CodeExchanger   CodeExchanger
	Users           UserStore
}

type AuthService struct {
	cfg AuthConfig
}

func NewAuthService(cfg AuthConfig) *AuthService {
	if cfg.CodeExchanger == nil {
		cfg.CodeExchanger = WeChatCodeExchanger(cfg.AppID, cfg.AppSecret)
	}
	return &AuthService{cfg: cfg}
}

func (s *AuthService) LoginWithCode(ctx context.Context, code string) (domain.LoginResult, error) {
	if strings.TrimSpace(code) == "" {
		return domain.LoginResult{}, fmt.Errorf("login code is required")
	}
	if s.cfg.Users == nil {
		return domain.LoginResult{}, fmt.Errorf("user store is required")
	}

	session, err := s.cfg.CodeExchanger(ctx, code)
	if err != nil {
		return domain.LoginResult{}, err
	}
	if session.OpenID == "" {
		return domain.LoginResult{}, fmt.Errorf("wechat openid is empty")
	}

	user, err := s.cfg.Users.UpsertByOpenID(ctx, session.OpenID)
	if err != nil {
		return domain.LoginResult{}, err
	}
	if containsString(s.cfg.MerchantOpenIDs, session.OpenID) && !containsString(user.Roles, "merchant") {
		user.Roles = append(user.Roles, "merchant")
	}

	token, err := s.SignToken(user)
	if err != nil {
		return domain.LoginResult{}, err
	}

	return domain.LoginResult{Token: token, User: user}, nil
}

func (s *AuthService) SignToken(user domain.UserSession) (string, error) {
	payload, err := json.Marshal(user)
	if err != nil {
		return "", err
	}
	body := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, []byte(s.cfg.TokenSecret))
	mac.Write([]byte(body))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return body + "." + signature, nil
}

func (s *AuthService) ParseToken(token string) (domain.UserSession, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return domain.UserSession{}, fmt.Errorf("invalid token")
	}
	mac := hmac.New(sha256.New, []byte(s.cfg.TokenSecret))
	mac.Write([]byte(parts[0]))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return domain.UserSession{}, fmt.Errorf("invalid token signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return domain.UserSession{}, err
	}
	var user domain.UserSession
	if err := json.Unmarshal(payload, &user); err != nil {
		return domain.UserSession{}, err
	}
	return user, nil
}

func WeChatCodeExchanger(appID string, appSecret string) CodeExchanger {
	return func(ctx context.Context, code string) (WeChatSession, error) {
		if appID == "" || appSecret == "" {
			return WeChatSession{}, fmt.Errorf("wechat app id and secret are required")
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.weixin.qq.com/sns/jscode2session", nil)
		if err != nil {
			return WeChatSession{}, err
		}
		query := req.URL.Query()
		query.Set("appid", appID)
		query.Set("secret", appSecret)
		query.Set("js_code", code)
		query.Set("grant_type", "authorization_code")
		req.URL.RawQuery = query.Encode()

		client := &http.Client{Timeout: 8 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return WeChatSession{}, err
		}
		defer resp.Body.Close()

		var session WeChatSession
		if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
			return WeChatSession{}, err
		}
		if session.ErrCode != 0 {
			return WeChatSession{}, fmt.Errorf("wechat code2session failed: %d %s", session.ErrCode, session.ErrMsg)
		}
		return session, nil
	}
}

func containsString(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}
