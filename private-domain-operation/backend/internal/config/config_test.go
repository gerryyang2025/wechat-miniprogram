package config

import "testing"

func TestLoadIncludesIntegrationConfig(t *testing.T) {
	t.Setenv("DATABASE_PATH", "data/test.db")
	t.Setenv("MIGRATIONS_DIR", "custom/migrations")
	t.Setenv("WECHAT_APP_ID", "wx-app")
	t.Setenv("WECHAT_APP_SECRET", "wx-secret")
	t.Setenv("TOKEN_SECRET", "secret-value")
	t.Setenv("MERCHANT_OPENIDS", "merchant-1, merchant-2")

	cfg := Load()

	if cfg.DatabasePath != "data/test.db" {
		t.Fatalf("DatabasePath = %q", cfg.DatabasePath)
	}
	if cfg.MigrationsDir != "custom/migrations" {
		t.Fatalf("MigrationsDir = %q", cfg.MigrationsDir)
	}
	if cfg.WeChatAppID != "wx-app" {
		t.Fatalf("WeChatAppID = %q", cfg.WeChatAppID)
	}
	if cfg.WeChatAppSecret != "wx-secret" {
		t.Fatalf("WeChatAppSecret = %q", cfg.WeChatAppSecret)
	}
	if cfg.TokenSecret != "secret-value" {
		t.Fatalf("TokenSecret = %q", cfg.TokenSecret)
	}
	if len(cfg.MerchantOpenIDs) != 2 || cfg.MerchantOpenIDs[0] != "merchant-1" || cfg.MerchantOpenIDs[1] != "merchant-2" {
		t.Fatalf("MerchantOpenIDs = %#v", cfg.MerchantOpenIDs)
	}
}
