package main

import (
	"context"
	"fmt"
	"log"

	"private-domain-operation/backend/internal/config"
	"private-domain-operation/backend/internal/db"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	conn, err := db.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer conn.Close()

	if err := db.Migrate(ctx, conn, cfg.MigrationsDir); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	fmt.Printf("database migrated: %s\n", cfg.DatabasePath)
}
