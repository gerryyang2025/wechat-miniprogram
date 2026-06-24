package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/config"
	"private-domain-operation/backend/internal/service"
)

func NewRouter(cfg config.Config) *gin.Engine {
	return newRouter(cfg, Dependencies{})
}

func NewRouterWithDependencies(deps Dependencies) *gin.Engine {
	return newRouter(config.Config{}, deps)
}

func newRouter(cfg config.Config, deps Dependencies) *gin.Engine {
	cfg = cfg.Normalized()
	deps = ensureDependencies(cfg, deps)

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery(), gin.Logger(), requestIDMiddleware())

	router.GET("/healthz", func(c *gin.Context) {
		ok(c, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1", optionalAuthMiddleware(deps))
	{
		api.GET("/health", func(c *gin.Context) {
			ok(c, gin.H{"status": "ok"})
		})

		api.POST("/auth/wechat-login", handleWechatLogin(deps))
		api.GET("/home", handleHome(deps))
		api.GET("/profile", handleProfile)
		api.GET("/product-categories", handleProductCategories)
		api.GET("/products", handleProducts(deps))
		api.GET("/products/:product_id", handleProductDetail(deps))
		api.GET("/courses/:course_id/player", handlePlayerCourse(deps))
		api.GET("/learning", handleLearning(deps))
		api.GET("/learning/courses/:course_id/progress", requireAuthMiddleware(deps), handleCourseProgress(deps))
		api.POST("/learning/courses/:course_id/progress", requireAuthMiddleware(deps), handleUpdateProgress(deps))
		api.GET("/bootcamps/:camp_id", handleBootcampDetail)
		api.GET("/live-events", handleLiveList)
		api.GET("/live-events/:live_id", handleLiveDetail)
		api.GET("/live-events/:live_id/room", handleLiveRoom)
		api.GET("/member-rights", handleMemberRights)
		api.GET("/notifications", handleNotifications)
		api.GET("/settings", handleSettings)
		api.GET("/consultation", handleConsultation)

		merchant := api.Group("/merchant", requireMerchantMiddleware(deps))
		{
			merchant.GET("/dashboard", handleMerchantDashboard)
			merchant.GET("/products", handleMerchantProducts(deps))
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

func defaultDependencies(cfg config.Config) Dependencies {
	cfg = cfg.Normalized()
	return Dependencies{
		Auth: service.NewAuthService(service.AuthConfig{
			AppID:                    cfg.WeChatAppID,
			AppSecret:                cfg.WeChatAppSecret,
			TokenSecret:              cfg.TokenSecret,
			AllowInsecureTokenSecret: cfg.Env != "production",
			MerchantOpenIDs:          cfg.MerchantOpenIDs,
			Users:                    newTransientUserStore(),
		}),
	}
}

func ensureDependencies(cfg config.Config, deps Dependencies) Dependencies {
	if deps.Auth == nil {
		defaults := defaultDependencies(cfg)
		deps.Auth = defaults.Auth
	}
	return deps
}
