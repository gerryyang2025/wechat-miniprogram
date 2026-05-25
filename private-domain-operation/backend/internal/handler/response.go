package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type responseBody struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	RequestID string      `json:"request_id,omitempty"`
}

func ok(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, responseBody{
		Code:      0,
		Message:   "ok",
		Data:      data,
		RequestID: requestIDFromContext(c),
	})
}

func errorJSON(c *gin.Context, status int, code int, message string) {
	c.JSON(status, responseBody{
		Code:      code,
		Message:   message,
		RequestID: requestIDFromContext(c),
	})
}

func requestIDFromContext(c *gin.Context) string {
	value, exists := c.Get("request_id")
	if !exists {
		return ""
	}

	requestID, _ := value.(string)
	return requestID
}
