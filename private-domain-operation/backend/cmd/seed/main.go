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

	merchantOpenID := ""
	if len(cfg.MerchantOpenIDs) > 0 {
		merchantOpenID = cfg.MerchantOpenIDs[0]
	}

	if err := db.SeedMinimal(ctx, conn, db.SeedOptions{MerchantOpenID: merchantOpenID}); err != nil {
		log.Fatalf("seed database: %v", err)
	}

	fmt.Printf("seed data ready: %s\n", cfg.DatabasePath)
}
