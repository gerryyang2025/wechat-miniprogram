package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"private-domain-operation/backend/internal/domain"
)

type LiveRepository struct {
	db *sql.DB
}

type liveEventScanner interface {
	Scan(dest ...any) error
}

func NewLiveRepository(db *sql.DB) *LiveRepository {
	return &LiveRepository{db: db}
}

func (r *LiveRepository) ListLiveEvents(ctx context.Context, _ domain.LiveListFilter) ([]domain.LiveEvent, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			id,
			merchant_id,
			title,
			summary,
			speaker,
			cover_url,
			COALESCE(start_at, ''),
			COALESCE(end_at, ''),
			status,
			status_override,
			live_url,
			replay_url,
			visibility,
			COALESCE(visibility_ref_id, 0),
			replay_enabled,
			updated_at
		FROM live_events
		ORDER BY COALESCE(start_at, ''), id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]domain.LiveEvent, 0)
	for rows.Next() {
		event, err := scanLiveEvent(rows)
		if err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return events, nil
}

func (r *LiveRepository) GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error) {
	event, err := r.getLiveEvent(ctx, liveID)
	if err != nil {
		return domain.LiveDetail{}, err
	}

	requiredAccess, err := r.requiredAccess(ctx, event)
	if err != nil {
		return domain.LiveDetail{}, err
	}

	return domain.LiveDetail{
		LiveEvent:      event,
		Intro:          event.Summary,
		Viewers:        "观看权限以当前账号为准",
		AccessRules:    liveAccessRules(event),
		Highlights:     liveHighlights(event),
		ReplaySupport:  liveReplaySupport(event),
		ReplayMoments:  []domain.LiveReplayMoment{},
		TeacherBio:     liveTeacherBio(event.Speaker),
		RequiredAccess: requiredAccess,
	}, nil
}

func (r *LiveRepository) GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error) {
	event, err := r.getLiveEvent(ctx, liveID)
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	return editPayloadFromLiveEvent(event), nil
}

func (r *LiveRepository) CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO live_events (
			merchant_id,
			title,
			summary,
			speaker,
			cover_url,
			start_at,
			end_at,
			status,
			status_override,
			live_url,
			replay_url,
			visibility,
			visibility_ref_id,
			replay_enabled
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?, ?, ?, NULLIF(?, 0), ?)
	`,
		merchantID,
		payload.Title,
		payload.Summary,
		payload.Speaker,
		payload.CoverURL,
		payload.StartAt,
		payload.EndAt,
		payload.StatusOverride,
		payload.LiveURL,
		payload.ReplayURL,
		payload.Visibility,
		payload.VisibilityRefID,
		boolToInt(payload.ReplayEnabled),
	)
	if err != nil {
		return domain.LiveEditPayload{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	return r.GetLiveEdit(ctx, id)
}

func (r *LiveRepository) UpdateLiveEvent(ctx context.Context, liveID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	result, err := r.db.ExecContext(ctx, `
		UPDATE live_events
		SET title = ?,
			summary = ?,
			speaker = ?,
			cover_url = ?,
			start_at = ?,
			end_at = ?,
			status_override = ?,
			live_url = ?,
			replay_url = ?,
			visibility = ?,
			visibility_ref_id = NULLIF(?, 0),
			replay_enabled = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`,
		payload.Title,
		payload.Summary,
		payload.Speaker,
		payload.CoverURL,
		payload.StartAt,
		payload.EndAt,
		payload.StatusOverride,
		payload.LiveURL,
		payload.ReplayURL,
		payload.Visibility,
		payload.VisibilityRefID,
		boolToInt(payload.ReplayEnabled),
		liveID,
	)
	if err != nil {
		return domain.LiveEditPayload{}, err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return domain.LiveEditPayload{}, err
	}
	if affected == 0 {
		return domain.LiveEditPayload{}, sql.ErrNoRows
	}
	return r.GetLiveEdit(ctx, liveID)
}

func (r *LiveRepository) HasActiveGrant(ctx context.Context, userID int64, accessType string, accessRefID int64) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM content_access_grants
		WHERE user_id = ?
			AND access_type = ?
			AND access_ref_id = ?
			AND status = 'active'
			AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
			AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
	`, userID, accessType, accessRefID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *LiveRepository) GetAccessOptions(ctx context.Context) (domain.LiveAccessOptions, error) {
	courses, err := r.queryAccessOptions(ctx, "course", `
		SELECT id, title
		FROM courses
		ORDER BY id
	`)
	if err != nil {
		return domain.LiveAccessOptions{}, err
	}

	bootcamps, err := r.queryAccessOptions(ctx, "bootcamp", `
		SELECT id, title
		FROM bootcamps
		ORDER BY id
	`)
	if err != nil {
		return domain.LiveAccessOptions{}, err
	}

	return domain.LiveAccessOptions{
		Courses:   courses,
		Bootcamps: bootcamps,
		Members: []domain.LiveAccessOption{{
			Type:  "member",
			ID:    1,
			Title: "年度会员计划",
		}},
	}, nil
}

func (r *LiveRepository) MerchantIDForUser(ctx context.Context, userID int64) (int64, error) {
	var merchantID int64
	err := r.db.QueryRowContext(ctx, `
		SELECT merchant_id
		FROM merchant_users
		WHERE user_id = ? AND status = 'active'
		ORDER BY id
		LIMIT 1
	`, userID).Scan(&merchantID)
	if err != nil {
		return 0, err
	}
	return merchantID, nil
}

func (r *LiveRepository) getLiveEvent(ctx context.Context, liveID int64) (domain.LiveEvent, error) {
	return scanLiveEvent(r.db.QueryRowContext(ctx, `
		SELECT
			id,
			merchant_id,
			title,
			summary,
			speaker,
			cover_url,
			COALESCE(start_at, ''),
			COALESCE(end_at, ''),
			status,
			status_override,
			live_url,
			replay_url,
			visibility,
			COALESCE(visibility_ref_id, 0),
			replay_enabled,
			updated_at
		FROM live_events
		WHERE id = ?
	`, liveID))
}

func (r *LiveRepository) queryAccessOptions(ctx context.Context, optionType string, query string) ([]domain.LiveAccessOption, error) {
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	options := make([]domain.LiveAccessOption, 0)
	for rows.Next() {
		option := domain.LiveAccessOption{Type: optionType}
		if err := rows.Scan(&option.ID, &option.Title); err != nil {
			return nil, err
		}
		options = append(options, option)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return options, nil
}

func (r *LiveRepository) requiredAccess(ctx context.Context, event domain.LiveEvent) (domain.LiveRequiredAccess, error) {
	title, err := r.accessTitle(ctx, event.Visibility, event.VisibilityRefID)
	if err != nil {
		return domain.LiveRequiredAccess{}, err
	}
	return domain.LiveRequiredAccess{
		Type:  event.Visibility,
		ID:    event.VisibilityRefID,
		Title: title,
	}, nil
}

func (r *LiveRepository) accessTitle(ctx context.Context, accessType string, accessRefID int64) (string, error) {
	switch strings.TrimSpace(accessType) {
	case "course":
		return r.contentTitle(ctx, accessRefID, "SELECT title FROM courses WHERE id = ?", "指定课程")
	case "bootcamp":
		return r.contentTitle(ctx, accessRefID, "SELECT title FROM bootcamps WHERE id = ?", "指定训练营")
	case "member":
		return "年度会员计划", nil
	default:
		return "全部用户", nil
	}
}

func (r *LiveRepository) contentTitle(ctx context.Context, id int64, query string, fallback string) (string, error) {
	if id == 0 {
		return fallback, nil
	}

	var title string
	err := r.db.QueryRowContext(ctx, query, id).Scan(&title)
	if err == sql.ErrNoRows {
		return fallback, nil
	}
	if err != nil {
		return "", err
	}
	return title, nil
}

func scanLiveEvent(scanner liveEventScanner) (domain.LiveEvent, error) {
	var event domain.LiveEvent
	var replayEnabled int
	if err := scanner.Scan(
		&event.ID,
		&event.MerchantID,
		&event.Title,
		&event.Summary,
		&event.Speaker,
		&event.CoverURL,
		&event.StartAt,
		&event.EndAt,
		&event.Status,
		&event.StatusOverride,
		&event.LiveURL,
		&event.ReplayURL,
		&event.Visibility,
		&event.VisibilityRefID,
		&replayEnabled,
		&event.UpdatedAt,
	); err != nil {
		return domain.LiveEvent{}, err
	}

	event.PublicID = fmt.Sprintf("%d", event.ID)
	event.ReplayEnabled = replayEnabled != 0
	event.CoverHint = coverHintForLiveEvent(event)
	event.Audience = audienceForVisibility(event.Visibility)
	event.Theme = themeForLiveEvent(event)
	return event, nil
}

func editPayloadFromLiveEvent(event domain.LiveEvent) domain.LiveEditPayload {
	return domain.LiveEditPayload{
		ID:              event.ID,
		Title:           event.Title,
		Summary:         event.Summary,
		Speaker:         event.Speaker,
		CoverURL:        event.CoverURL,
		StartAt:         event.StartAt,
		EndAt:           event.EndAt,
		StatusOverride:  event.StatusOverride,
		LiveURL:         event.LiveURL,
		ReplayURL:       event.ReplayURL,
		Visibility:      event.Visibility,
		VisibilityRefID: event.VisibilityRefID,
		ReplayEnabled:   event.ReplayEnabled,
	}
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func coverHintForLiveEvent(event domain.LiveEvent) string {
	if strings.TrimSpace(event.Summary) != "" {
		return event.Summary
	}
	return audienceForVisibility(event.Visibility)
}

func audienceForVisibility(visibility string) string {
	switch strings.TrimSpace(visibility) {
	case "course":
		return "课程学员可观看"
	case "bootcamp":
		return "训练营成员可观看"
	case "member":
		return "会员用户可观看"
	default:
		return "登录用户可观看"
	}
}

func themeForLiveEvent(event domain.LiveEvent) string {
	switch strings.TrimSpace(event.Visibility) {
	case "course":
		return "purple"
	case "bootcamp":
		return "indigo"
	case "member":
		return "blue"
	default:
		return "teal"
	}
}

func liveAccessRules(event domain.LiveEvent) []string {
	return []string{
		audienceForVisibility(event.Visibility),
		"进入直播或回放前会校验当前账号权限",
		"直播结束后按配置开放回放链接",
	}
}

func liveHighlights(event domain.LiveEvent) []string {
	highlights := []string{
		"直播围绕课程学习和私域运营问题展开",
		"支持商家配置观看范围",
	}
	if event.ReplayEnabled {
		highlights = append(highlights, "支持回放链接维护")
	}
	return highlights
}

func liveReplaySupport(event domain.LiveEvent) []string {
	if event.ReplayEnabled {
		return []string{"回放开放后可按链接观看", "未配置回放时显示准备中"}
	}
	return []string{"当前直播未开启回放"}
}

func liveTeacherBio(speaker string) string {
	speaker = strings.TrimSpace(speaker)
	if speaker == "" {
		return "讲师长期聚焦个人 IP、知识产品和私域运营实践。"
	}
	return speaker + " 长期聚焦个人 IP、知识产品和私域运营实践。"
}
