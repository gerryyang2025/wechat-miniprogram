package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/config"
)

func NewRouter(cfg config.Config) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery(), gin.Logger(), requestIDMiddleware())

	router.GET("/healthz", func(c *gin.Context) {
		ok(c, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1", optionalAuthMiddleware())
	{
		api.GET("/health", func(c *gin.Context) {
			ok(c, gin.H{"status": "ok"})
		})

		api.POST("/auth/wechat-login", handleWechatLogin)
		api.GET("/home", handleHome)
		api.GET("/profile", handleProfile)
		api.GET("/product-categories", handleProductCategories)
		api.GET("/products", handleProducts)
		api.GET("/products/:product_id", handleProductDetail)
		api.GET("/courses/:course_id/player", handlePlayerCourse)
		api.GET("/learning", handleLearning)
		api.GET("/learning/courses/:course_id/progress", requireAuthMiddleware(), handleCourseProgress)
		api.POST("/learning/courses/:course_id/progress", requireAuthMiddleware(), handleUpdateProgress)
		api.GET("/bootcamps/:camp_id", handleBootcampDetail)
		api.GET("/live-events", handleLiveList)
		api.GET("/live-events/:live_id", handleLiveDetail)
		api.GET("/live-events/:live_id/room", handleLiveRoom)
		api.GET("/member-rights", handleMemberRights)
		api.GET("/notifications", handleNotifications)
		api.GET("/settings", handleSettings)
		api.GET("/consultation", handleConsultation)

		merchant := api.Group("/merchant", requireMerchantMiddleware())
		{
			merchant.GET("/dashboard", handleMerchantDashboard)
			merchant.GET("/products", handleMerchantProducts)
			merchant.GET("/live-events", handleMerchantLiveEvents)
			merchant.GET("/users", handleMerchantUsers)
			merchant.GET("/content-ops", handleMerchantContentOps)
		}
	}

	router.NoRoute(func(c *gin.Context) {
		errorJSON(c, http.StatusNotFound, 40400, "route not found")
	})

	return router
}
