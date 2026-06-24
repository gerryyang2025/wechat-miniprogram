package repository

import (
	"context"
	"database/sql"
	"strconv"

	"private-domain-operation/backend/internal/domain"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) UpsertByOpenID(ctx context.Context, openID string) (domain.UserSession, error) {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO users (openid, nickname, status)
		VALUES (?, '微信用户', 'active')
		ON CONFLICT(openid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
	`, openID)
	if err != nil {
		return domain.UserSession{}, err
	}

	var id int64
	var nickname string
	var avatarURL string
	var phone string
	err = r.db.QueryRowContext(ctx, `
		SELECT id, nickname, avatar_url, phone
		FROM users
		WHERE openid = ?
	`, openID).Scan(&id, &nickname, &avatarURL, &phone)
	if err != nil {
		return domain.UserSession{}, err
	}

	return domain.UserSession{
		ID:       strconv.FormatInt(id, 10),
		OpenID:   openID,
		Nickname: nickname,
		Avatar:   avatarURL,
		Phone:    phone,
		Roles:    []string{"student"},
	}, nil
}
