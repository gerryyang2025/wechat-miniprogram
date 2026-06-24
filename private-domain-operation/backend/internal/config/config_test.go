package config

import "testing"

func TestLoadIncludesIntegrationConfig(t *testing.T) {
	t.Setenv("DATABASE_PATH", "data/test.db")
	t.Setenv("MIGRATIONS_DIR", "custom/migrations")
	t.Setenv("WECHAT_APP_ID", "wx-app")
	t.Setenv("WECHAT_APP_SECRET", "wx-secret")
	t.Setenv("TOKEN_SECRET", "secret-value")
	t.Setenv("MERCHANT_OPENIDS", " merchant-1, , merchant-2 ")

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

func TestLoadUsesIntegrationDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("HTTP_HOST", "")
	t.Setenv("HTTP_PORT", "")
	t.Setenv("DATABASE_PATH", "")
	t.Setenv("MIGRATIONS_DIR", "")
	t.Setenv("WECHAT_APP_ID", "")
	t.Setenv("WECHAT_APP_SECRET", "")
	t.Setenv("TOKEN_SECRET", "")
	t.Setenv("MERCHANT_OPENIDS", "")

	cfg := Load()

	if cfg.Env != "development" {
		t.Fatalf("Env = %q", cfg.Env)
	}
	if cfg.Host != "127.0.0.1" {
		t.Fatalf("Host = %q", cfg.Host)
	}
	if cfg.Port != "8088" {
		t.Fatalf("Port = %q", cfg.Port)
	}
	if cfg.DatabasePath != "data/pdo.db" {
		t.Fatalf("DatabasePath = %q", cfg.DatabasePath)
	}
	if cfg.MigrationsDir != "migrations" {
		t.Fatalf("MigrationsDir = %q", cfg.MigrationsDir)
	}
	if cfg.WeChatAppID != "" {
		t.Fatalf("WeChatAppID = %q", cfg.WeChatAppID)
	}
	if cfg.WeChatAppSecret != "" {
		t.Fatalf("WeChatAppSecret = %q", cfg.WeChatAppSecret)
	}
	if cfg.TokenSecret != "pdo-development-secret" {
		t.Fatalf("TokenSecret = %q", cfg.TokenSecret)
	}
	if len(cfg.MerchantOpenIDs) != 0 {
		t.Fatalf("MerchantOpenIDs = %#v", cfg.MerchantOpenIDs)
	}
}

func TestLoadDoesNotDefaultProductionTokenSecret(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("TOKEN_SECRET", "")

	cfg := Load()

	if cfg.TokenSecret != "" {
		t.Fatalf("TokenSecret = %q, want empty production secret when unset", cfg.TokenSecret)
	}
}
