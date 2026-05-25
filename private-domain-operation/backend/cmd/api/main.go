package main

import (
	"log"

	"private-domain-operation/backend/internal/config"
	"private-domain-operation/backend/internal/handler"
)

func main() {
	cfg := config.Load()
	router := handler.NewRouter(cfg)

	if err := router.Run(cfg.Addr()); err != nil {
		log.Fatalf("api server stopped: %v", err)
	}
}
