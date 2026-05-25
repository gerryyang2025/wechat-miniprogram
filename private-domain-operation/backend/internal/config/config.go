package config

import (
	"fmt"
	"os"
)

type Config struct {
	Env  string
	Host string
	Port string
}

func Load() Config {
	return Config{
		Env:  getenv("APP_ENV", "development"),
		Host: getenv("HTTP_HOST", "127.0.0.1"),
		Port: getenv("HTTP_PORT", "8088"),
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
