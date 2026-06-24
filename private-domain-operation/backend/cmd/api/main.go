package main

import (
	"context"
	"log"

	"private-domain-operation/backend/internal/config"
	"private-domain-operation/backend/internal/db"
	"private-domain-operation/backend/internal/handler"
	"private-domain-operation/backend/internal/repository"
	"private-domain-operation/backend/internal/service"
)

func main() {
	cfg := config.Load()
	conn, err := db.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer conn.Close()

	if err := db.Migrate(context.Background(), conn, cfg.MigrationsDir); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	users := repository.NewUserRepository(conn)
	courses := repository.NewCourseRepository(conn)
	progress := repository.NewProgressRepository(conn)

	authService := service.NewAuthService(service.AuthConfig{
		AppID:                    cfg.WeChatAppID,
		AppSecret:                cfg.WeChatAppSecret,
		TokenSecret:              cfg.TokenSecret,
		AllowInsecureTokenSecret: cfg.Env != "production",
		MerchantOpenIDs:          cfg.MerchantOpenIDs,
		Users:                    users,
	})

	router := handler.NewRouterWithDependencies(handler.Dependencies{
		Auth:     authService,
		Courses:  service.NewCourseService(courses),
		Progress: service.NewProgressService(progress),
	})

	if err := router.Run(cfg.Addr()); err != nil {
		log.Fatalf("api server stopped: %v", err)
	}
}
