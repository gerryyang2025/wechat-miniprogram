package handler

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/service"
)

type Dependencies struct {
	Auth     *service.AuthService
	Courses  *service.CourseService
	Progress *service.ProgressService
}

type loginRequest struct {
	Code  string `json:"code"`
	Role  string `json:"role"`
	Phone string `json:"phone"`
}

const userContextKey = "current_user"

func handleWechatLogin(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		if deps.Auth == nil {
			writeLoginError(c, service.ErrAuthConfig)
			return
		}

		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
			errorJSON(c, http.StatusBadRequest, 40001, "invalid login request")
			return
		}

		result, err := deps.Auth.LoginWithCode(c.Request.Context(), req.Code)
		if err != nil {
			writeLoginError(c, err)
			return
		}
		ok(c, result)
	}
}

func writeLoginError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrMissingLoginCode):
		errorJSON(c, http.StatusBadRequest, 40001, "login code is required")
	case errors.Is(err, service.ErrWeChatUpstream):
		errorJSON(c, http.StatusBadGateway, 50201, "wechat login failed")
	case errors.Is(err, service.ErrAuthConfig), errors.Is(err, service.ErrUserStore):
		errorJSON(c, http.StatusInternalServerError, 50001, "login service unavailable")
	case errors.Is(err, service.ErrInvalidToken), errors.Is(err, service.ErrTokenExpired):
		errorJSON(c, http.StatusUnauthorized, 40102, "invalid login session")
	default:
		errorJSON(c, http.StatusUnauthorized, 40102, "login failed")
	}
}

func optionalAuthMiddleware(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		if session, ok := sessionFromRequest(deps, c); ok {
			c.Set(userContextKey, session)
		}
		c.Next()
	}
}

func requireAuthMiddleware(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		session, ok := sessionFromRequest(deps, c)
		if !ok {
			errorJSON(c, http.StatusUnauthorized, 40101, "login required")
			c.Abort()
			return
		}

		c.Set(userContextKey, session)
		c.Next()
	}
}

func requireMerchantMiddleware(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		session, ok := sessionFromRequest(deps, c)
		if !ok {
			errorJSON(c, http.StatusUnauthorized, 40101, "login required")
			c.Abort()
			return
		}

		if !hasRole(session, "merchant") {
			errorJSON(c, http.StatusForbidden, 40301, "merchant role required")
			c.Abort()
			return
		}

		c.Set(userContextKey, session)
		c.Next()
	}
}

func sessionFromRequest(deps Dependencies, c *gin.Context) (domain.UserSession, bool) {
	if deps.Auth == nil {
		return domain.UserSession{}, false
	}

	token := strings.TrimSpace(c.GetHeader("Authorization"))
	token = strings.TrimPrefix(token, "Bearer ")
	token = strings.TrimSpace(token)

	if token == "" {
		return domain.UserSession{}, false
	}

	session, err := deps.Auth.ParseToken(token)
	if err != nil {
		return domain.UserSession{}, false
	}
	return session, true
}

func currentUser(c *gin.Context) domain.UserSession {
	value, exists := c.Get(userContextKey)
	if !exists {
		return anonymousUserSession()
	}

	session, ok := value.(domain.UserSession)
	if !ok {
		return anonymousUserSession()
	}

	return session
}

func anonymousUserSession() domain.UserSession {
	return domain.UserSession{
		ID:       "anonymous-user",
		Nickname: "微信用户",
		Roles:    []string{"student"},
	}
}

func hasRole(session domain.UserSession, role string) bool {
	for _, item := range session.Roles {
		if item == role {
			return true
		}
	}

	return false
}

type transientUserStore struct {
	mu    sync.Mutex
	users map[string]domain.UserSession
}

// transientUserStore keeps NewRouter usable until cmd/api wires the real DB repository.
func newTransientUserStore() *transientUserStore {
	return &transientUserStore{users: make(map[string]domain.UserSession)}
}

func (s *transientUserStore) UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.users == nil {
		s.users = make(map[string]domain.UserSession)
	}
	if user, ok := s.users[openID]; ok {
		return user, nil
	}

	user := domain.UserSession{
		ID:       "transient-user-" + strconv.Itoa(len(s.users)+1),
		OpenID:   openID,
		Nickname: "微信用户",
		Roles:    []string{"student"},
	}
	s.users[openID] = user
	return user, nil
}
