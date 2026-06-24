package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Env             string
	Host            string
	Port            string
	DatabasePath    string
	MigrationsDir   string
	WeChatAppID     string
	WeChatAppSecret string
	TokenSecret     string
	MerchantOpenIDs []string
}

func Load() Config {
	return Config{
		Env:             getenv("APP_ENV", "development"),
		Host:            getenv("HTTP_HOST", "127.0.0.1"),
		Port:            getenv("HTTP_PORT", "8088"),
		DatabasePath:    getenv("DATABASE_PATH", "data/pdo.db"),
		MigrationsDir:   getenv("MIGRATIONS_DIR", "migrations"),
		WeChatAppID:     getenv("WECHAT_APP_ID", ""),
		WeChatAppSecret: getenv("WECHAT_APP_SECRET", ""),
		TokenSecret:     getenv("TOKEN_SECRET", "pdo-development-secret"),
		MerchantOpenIDs: splitCSV(getenv("MERCHANT_OPENIDS", "")),
	}
}

func (c Config) Addr() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}

func getenv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}
