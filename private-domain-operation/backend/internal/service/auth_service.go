package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"private-domain-operation/backend/internal/domain"
)

const (
	developmentTokenSecret = "pdo-development-secret"
	defaultTokenTTL        = 7 * 24 * time.Hour
	wechatCodeSessionURL   = "https://api.weixin.qq.com/sns/jscode2session"
)

var (
	ErrMissingLoginCode = errors.New("missing login code")
	ErrAuthConfig       = errors.New("auth configuration error")
	ErrWeChatUpstream   = errors.New("wechat code exchange failed")
	ErrUserStore        = errors.New("user store error")
	ErrInvalidToken     = errors.New("invalid token")
	ErrTokenExpired     = errors.New("token expired")
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
	AppID                    string
	AppSecret                string
	TokenSecret              string
	AllowInsecureTokenSecret bool
	MerchantOpenIDs          []string
	TokenTTL                 time.Duration
	Now                      func() time.Time
	CodeExchanger            CodeExchanger
	Users                    UserStore
}

type AuthService struct {
	cfg AuthConfig
}

type tokenClaims struct {
	User      domain.UserSession `json:"user"`
	IssuedAt  int64              `json:"iat"`
	ExpiresAt int64              `json:"exp"`
}

type httpDoer interface {
	Do(req *http.Request) (*http.Response, error)
}

func NewAuthService(cfg AuthConfig) *AuthService {
	if cfg.CodeExchanger == nil {
		cfg.CodeExchanger = WeChatCodeExchanger(cfg.AppID, cfg.AppSecret)
	}
	if cfg.TokenTTL <= 0 {
		cfg.TokenTTL = defaultTokenTTL
	}
	if cfg.Now == nil {
		cfg.Now = time.Now
	}
	return &AuthService{cfg: cfg}
}

func (s *AuthService) LoginWithCode(ctx context.Context, code string) (domain.LoginResult, error) {
	if strings.TrimSpace(code) == "" {
		return domain.LoginResult{}, ErrMissingLoginCode
	}
	if s.cfg.Users == nil {
		return domain.LoginResult{}, fmt.Errorf("%w: user store is required", ErrAuthConfig)
	}
	if err := s.validateTokenSecret(); err != nil {
		return domain.LoginResult{}, err
	}

	session, err := s.cfg.CodeExchanger(ctx, code)
	if err != nil {
		if errors.Is(err, ErrAuthConfig) {
			return domain.LoginResult{}, err
		}
		return domain.LoginResult{}, fmt.Errorf("%w: %v", ErrWeChatUpstream, err)
	}
	if session.OpenID == "" {
		return domain.LoginResult{}, fmt.Errorf("%w: empty openid", ErrWeChatUpstream)
	}

	user, err := s.cfg.Users.UpsertByOpenID(ctx, session.OpenID)
	if err != nil {
		return domain.LoginResult{}, fmt.Errorf("%w: %v", ErrUserStore, err)
	}
	user = s.reconcileMerchantRole(user)

	token, err := s.SignToken(user)
	if err != nil {
		return domain.LoginResult{}, err
	}

	return domain.LoginResult{Token: token, User: user}, nil
}

func (s *AuthService) SignToken(user domain.UserSession) (string, error) {
	if err := s.validateTokenSecret(); err != nil {
		return "", err
	}

	now := s.now()
	claims := tokenClaims{
		User:      user,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(s.cfg.TokenTTL).Unix(),
	}
	payload, err := json.Marshal(claims)
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
	if err := s.validateTokenSecret(); err != nil {
		return domain.UserSession{}, err
	}

	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return domain.UserSession{}, ErrInvalidToken
	}
	mac := hmac.New(sha256.New, []byte(s.cfg.TokenSecret))
	mac.Write([]byte(parts[0]))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return domain.UserSession{}, ErrInvalidToken
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return domain.UserSession{}, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	var claims tokenClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return domain.UserSession{}, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	if claims.ExpiresAt <= s.now().Unix() {
		return domain.UserSession{}, ErrTokenExpired
	}
	return s.reconcileMerchantRole(claims.User), nil
}

func WeChatCodeExchanger(appID string, appSecret string) CodeExchanger {
	return newWeChatCodeExchanger(appID, appSecret, wechatCodeSessionURL, &http.Client{Timeout: 8 * time.Second})
}

func newWeChatCodeExchanger(appID string, appSecret string, endpoint string, client httpDoer) CodeExchanger {
	return func(ctx context.Context, code string) (WeChatSession, error) {
		if appID == "" || appSecret == "" {
			return WeChatSession{}, fmt.Errorf("%w: wechat app id and secret are required", ErrAuthConfig)
		}
		if client == nil {
			client = &http.Client{Timeout: 8 * time.Second}
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
		if err != nil {
			return WeChatSession{}, fmt.Errorf("%w: %v", ErrWeChatUpstream, err)
		}
		query := req.URL.Query()
		query.Set("appid", appID)
		query.Set("secret", appSecret)
		query.Set("js_code", code)
		query.Set("grant_type", "authorization_code")
		req.URL.RawQuery = query.Encode()

		resp, err := client.Do(req)
		if err != nil {
			return WeChatSession{}, fmt.Errorf("%w: %v", ErrWeChatUpstream, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
			_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 512))
			return WeChatSession{}, fmt.Errorf("%w: http status %d", ErrWeChatUpstream, resp.StatusCode)
		}

		var session WeChatSession
		if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
			return WeChatSession{}, fmt.Errorf("%w: %v", ErrWeChatUpstream, err)
		}
		if session.ErrCode != 0 {
			return WeChatSession{}, fmt.Errorf("%w: errcode %d", ErrWeChatUpstream, session.ErrCode)
		}
		return session, nil
	}
}

func (s *AuthService) validateTokenSecret() error {
	secret := strings.TrimSpace(s.cfg.TokenSecret)
	if secret == "" {
		return fmt.Errorf("%w: token secret is required", ErrAuthConfig)
	}
	if secret == developmentTokenSecret && !s.cfg.AllowInsecureTokenSecret {
		return fmt.Errorf("%w: insecure development token secret is not allowed", ErrAuthConfig)
	}
	return nil
}

func (s *AuthService) now() time.Time {
	if s.cfg.Now == nil {
		return time.Now()
	}
	return s.cfg.Now()
}

func (s *AuthService) reconcileMerchantRole(user domain.UserSession) domain.UserSession {
	if containsString(s.cfg.MerchantOpenIDs, user.OpenID) {
		if !containsString(user.Roles, "merchant") {
			user.Roles = append(user.Roles, "merchant")
		}
		return user
	}

	user.Roles = removeString(user.Roles, "merchant")
	return user
}

func containsString(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func removeString(items []string, target string) []string {
	result := items[:0]
	for _, item := range items {
		if item != target {
			result = append(result, item)
		}
	}
	return result
}
