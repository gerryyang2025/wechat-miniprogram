package handler

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type userSession struct {
	ID       string   `json:"id"`
	OpenID   string   `json:"openid"`
	Nickname string   `json:"nickname"`
	Avatar   string   `json:"avatar_url"`
	Phone    string   `json:"phone"`
	Roles    []string `json:"roles"`
}

type loginRequest struct {
	Code  string `json:"code"`
	Role  string `json:"role"`
	Phone string `json:"phone"`
}

const userContextKey = "current_user"

var tokenSessions = map[string]userSession{
	"dev-user-token": {
		ID:       "user-1",
		OpenID:   "mock-openid-user",
		Nickname: "时昕同学",
		Avatar:   "",
		Phone:    "",
		Roles:    []string{"student"},
	},
	"dev-merchant-token": {
		ID:       "merchant-user-1",
		OpenID:   "mock-openid-merchant",
		Nickname: "Gerry",
		Avatar:   "",
		Phone:    "",
		Roles:    []string{"student", "merchant"},
	},
}

func handleWechatLogin(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		errorJSON(c, http.StatusBadRequest, 40001, "invalid login request")
		return
	}

	token := "dev-user-token"
	if req.Role == "merchant" || strings.Contains(strings.ToLower(req.Code), "merchant") {
		token = "dev-merchant-token"
	}

	session := tokenSessions[token]
	if req.Phone != "" {
		session.Phone = req.Phone
	}

	ok(c, gin.H{
		"token": token,
		"user":  session,
	})
}

func optionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if session, ok := sessionFromRequest(c); ok {
			c.Set(userContextKey, session)
		}
		c.Next()
	}
}

func requireAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session, ok := sessionFromRequest(c)
		if !ok {
			errorJSON(c, http.StatusUnauthorized, 40101, "login required")
			c.Abort()
			return
		}

		c.Set(userContextKey, session)
		c.Next()
	}
}

func requireMerchantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session, ok := sessionFromRequest(c)
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

func sessionFromRequest(c *gin.Context) (userSession, bool) {
	token := strings.TrimSpace(c.GetHeader("Authorization"))
	token = strings.TrimPrefix(token, "Bearer ")
	token = strings.TrimSpace(token)

	if token == "" {
		return userSession{}, false
	}

	session, ok := tokenSessions[token]
	return session, ok
}

func currentUser(c *gin.Context) userSession {
	value, exists := c.Get(userContextKey)
	if !exists {
		return tokenSessions["dev-user-token"]
	}

	session, ok := value.(userSession)
	if !ok {
		return tokenSessions["dev-user-token"]
	}

	return session
}

func hasRole(session userSession, role string) bool {
	for _, item := range session.Roles {
		if item == role {
			return true
		}
	}

	return false
}
