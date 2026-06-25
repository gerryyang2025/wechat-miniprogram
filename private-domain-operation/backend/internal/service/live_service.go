package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"private-domain-operation/backend/internal/domain"
)

var (
	ErrLiveStoreRequired = errors.New("live store is required")
	ErrLiveValidation    = errors.New("live validation failed")
	ErrLiveAccessDenied  = errors.New("live access denied")
)

type LiveStore interface {
	ListLiveEvents(ctx context.Context, filter domain.LiveListFilter) ([]domain.LiveEvent, error)
	GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error)
	GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error)
	CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error)
	UpdateLiveEvent(ctx context.Context, liveID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error)
	VisibilityRefBelongsToMerchant(ctx context.Context, merchantID int64, visibility string, refID int64) (bool, error)
	HasActiveGrant(ctx context.Context, userID int64, accessType string, accessRefID int64) (bool, error)
	GetAccessOptions(ctx context.Context, merchantID int64) (domain.LiveAccessOptions, error)
	MerchantIDForUser(ctx context.Context, userID int64) (int64, error)
}

type LiveService struct {
	lives LiveStore
	now   func() time.Time
}

func NewLiveService(lives LiveStore) *LiveService {
	return &LiveService{
		lives: lives,
		now:   time.Now,
	}
}

func (s *LiveService) ListLiveEvents(ctx context.Context, status string) ([]domain.LiveEvent, error) {
	if s.lives == nil {
		return nil, ErrLiveStoreRequired
	}

	normalizedStatus := normalizeLiveStatusFilter(status)
	events, err := s.lives.ListLiveEvents(ctx, domain.LiveListFilter{Status: "all"})
	if err != nil {
		return nil, err
	}

	now := s.currentTime()
	decorated := make([]domain.LiveEvent, 0, len(events))
	for _, event := range events {
		event = decorateLiveEvent(event, now)
		if normalizedStatus == "all" || event.EffectiveStatus == normalizedStatus {
			decorated = append(decorated, event)
		}
	}
	return decorated, nil
}

func (s *LiveService) GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error) {
	if s.lives == nil {
		return domain.LiveDetail{}, ErrLiveStoreRequired
	}

	detail, err := s.lives.GetLiveDetail(ctx, liveID)
	if err != nil {
		return domain.LiveDetail{}, err
	}
	detail.LiveEvent = decorateLiveEvent(detail.LiveEvent, s.currentTime())
	return detail, nil
}

func (s *LiveService) GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error) {
	if s.lives == nil {
		return domain.LiveEditPayload{}, ErrLiveStoreRequired
	}
	return s.lives.GetLiveEdit(ctx, liveID)
}

func (s *LiveService) CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	if s.lives == nil {
		return domain.LiveEditPayload{}, ErrLiveStoreRequired
	}
	if err := validateLiveEdit(payload); err != nil {
		return domain.LiveEditPayload{}, err
	}
	if err := s.validateVisibilityOwnership(ctx, merchantID, payload); err != nil {
		return domain.LiveEditPayload{}, err
	}
	return s.lives.CreateLiveEvent(ctx, merchantID, payload)
}

func (s *LiveService) UpdateLiveEvent(ctx context.Context, liveID int64, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	if s.lives == nil {
		return domain.LiveEditPayload{}, ErrLiveStoreRequired
	}
	if err := validateLiveEdit(payload); err != nil {
		return domain.LiveEditPayload{}, err
	}
	if err := s.validateVisibilityOwnership(ctx, merchantID, payload); err != nil {
		return domain.LiveEditPayload{}, err
	}
	return s.lives.UpdateLiveEvent(ctx, liveID, payload)
}

func (s *LiveService) GetAccessOptions(ctx context.Context, merchantID int64) (domain.LiveAccessOptions, error) {
	if s.lives == nil {
		return domain.LiveAccessOptions{}, ErrLiveStoreRequired
	}
	return s.lives.GetAccessOptions(ctx, merchantID)
}

func (s *LiveService) MerchantIDForUser(ctx context.Context, userID int64) (int64, error) {
	if s.lives == nil {
		return 0, ErrLiveStoreRequired
	}
	return s.lives.MerchantIDForUser(ctx, userID)
}

func (s *LiveService) CheckAccess(ctx context.Context, userID int64, liveID int64, mode string) (domain.LiveAccessDecision, error) {
	if s.lives == nil {
		return domain.LiveAccessDecision{}, ErrLiveStoreRequired
	}

	detail, err := s.GetLiveDetail(ctx, liveID)
	if err != nil {
		return domain.LiveAccessDecision{}, err
	}

	normalizedMode := normalizeLiveAccessMode(mode, detail.EffectiveStatus)
	if normalizedMode == "live" && detail.EffectiveStatus != "live" {
		return domain.LiveAccessDecision{
			Allowed: false,
			Mode:    normalizedMode,
			Reason:  liveStateDeniedReason(detail.EffectiveStatus, normalizedMode),
		}, nil
	}
	if normalizedMode == "replay" && detail.EffectiveStatus != "replay" {
		return domain.LiveAccessDecision{
			Allowed: false,
			Mode:    normalizedMode,
			Reason:  liveStateDeniedReason(detail.EffectiveStatus, normalizedMode),
		}, nil
	}

	visibility := normalizeLiveVisibility(detail.Visibility)
	if visibility != "all" {
		hasGrant, err := s.lives.HasActiveGrant(ctx, userID, visibility, detail.VisibilityRefID)
		if err != nil {
			return domain.LiveAccessDecision{}, err
		}
		if !hasGrant {
			return domain.LiveAccessDecision{
				Allowed:        false,
				Mode:           normalizedMode,
				Reason:         "暂无观看权限",
				RequiredAccess: requiredAccessForLiveDetail(detail, visibility),
			}, nil
		}
	}

	targetURL := detail.LiveURL
	if normalizedMode == "replay" {
		targetURL = detail.ReplayURL
	}
	targetURL = strings.TrimSpace(targetURL)
	if targetURL == "" || !strings.HasPrefix(targetURL, "https://") {
		return domain.LiveAccessDecision{
			Allowed: false,
			Mode:    normalizedMode,
			Reason:  "直播链接暂未配置",
		}, nil
	}

	return domain.LiveAccessDecision{
		Allowed:        true,
		Mode:           normalizedMode,
		TargetURL:      targetURL,
		OpenMethod:     "web_view",
		FallbackAction: "copy_link",
	}, nil
}

func validateLiveEdit(payload domain.LiveEditPayload) error {
	if strings.TrimSpace(payload.Title) == "" {
		return fmt.Errorf("%w: live title is required", ErrLiveValidation)
	}

	startAt, err := time.Parse(time.RFC3339, payload.StartAt)
	if err != nil {
		return fmt.Errorf("%w: start time must use RFC3339", ErrLiveValidation)
	}
	endAt, err := time.Parse(time.RFC3339, payload.EndAt)
	if err != nil {
		return fmt.Errorf("%w: end time must use RFC3339", ErrLiveValidation)
	}
	if !endAt.After(startAt) {
		return fmt.Errorf("%w: end time must be after start time", ErrLiveValidation)
	}

	statusOverride := payload.StatusOverride
	if statusOverride != "" && !isValidLiveStatus(statusOverride) {
		return fmt.Errorf("%w: status override is invalid", ErrLiveValidation)
	}

	if payload.CoverURL != "" && !strings.HasPrefix(payload.CoverURL, "https://") {
		return fmt.Errorf("%w: cover url must use https", ErrLiveValidation)
	}
	if payload.LiveURL != "" && !strings.HasPrefix(payload.LiveURL, "https://") {
		return fmt.Errorf("%w: live url must use https", ErrLiveValidation)
	}
	if payload.ReplayURL != "" && !strings.HasPrefix(payload.ReplayURL, "https://") {
		return fmt.Errorf("%w: replay url must use https", ErrLiveValidation)
	}

	visibility := payload.Visibility
	if !isValidLiveVisibility(visibility) {
		return fmt.Errorf("%w: visibility is invalid", ErrLiveValidation)
	}
	if visibility != "all" && payload.VisibilityRefID <= 0 {
		return fmt.Errorf("%w: visibility ref id is required", ErrLiveValidation)
	}

	return nil
}

func (s *LiveService) validateVisibilityOwnership(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) error {
	visibility := payload.Visibility
	if visibility == "all" || visibility == "member" {
		return nil
	}

	owned, err := s.lives.VisibilityRefBelongsToMerchant(ctx, merchantID, visibility, payload.VisibilityRefID)
	if err != nil {
		return err
	}
	if !owned {
		return fmt.Errorf("%w: visibility ref does not belong to merchant", ErrLiveValidation)
	}
	return nil
}

func effectiveLiveStatus(event domain.LiveEvent, now time.Time) string {
	statusOverride := event.StatusOverride
	if statusOverride != "" && isValidLiveStatus(statusOverride) {
		return statusOverride
	}

	startAt, startErr := time.Parse(time.RFC3339, event.StartAt)
	endAt, endErr := time.Parse(time.RFC3339, event.EndAt)
	if startErr != nil || endErr != nil {
		return "ended"
	}
	if now.Before(startAt) {
		return "upcoming"
	}
	if !now.Before(startAt) && !now.After(endAt) {
		return "live"
	}
	if now.After(endAt) && event.ReplayEnabled && strings.TrimSpace(event.ReplayURL) != "" {
		return "replay"
	}
	return "ended"
}

func decorateLiveEvent(event domain.LiveEvent, now time.Time) domain.LiveEvent {
	status := effectiveLiveStatus(event, now)
	event.EffectiveStatus = status
	event.Status = status
	event.StatusLabel = liveStatusLabel(status)
	event.Schedule = liveSchedule(status, event)
	event.Duration = liveDuration(event)
	event.ActionText = liveActionText(status)
	return event
}

func (s *LiveService) currentTime() time.Time {
	if s.now == nil {
		return time.Now()
	}
	return s.now()
}

func normalizeLiveStatusFilter(status string) string {
	status = strings.ToLower(strings.TrimSpace(status))
	if status == "" || status == "all" {
		return "all"
	}
	if isValidLiveStatus(status) {
		return status
	}
	return "all"
}

func normalizeLiveAccessMode(mode string, effectiveStatus string) string {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case "live":
		return "live"
	case "replay":
		return "replay"
	default:
		if effectiveStatus == "replay" {
			return "replay"
		}
		return "live"
	}
}

func normalizeLiveVisibility(visibility string) string {
	visibility = strings.ToLower(strings.TrimSpace(visibility))
	if visibility == "" {
		return "all"
	}
	return visibility
}

func isValidLiveStatus(status string) bool {
	switch status {
	case "upcoming", "live", "ended", "replay":
		return true
	default:
		return false
	}
}

func isValidLiveVisibility(visibility string) bool {
	switch visibility {
	case "all", "course", "bootcamp", "member":
		return true
	default:
		return false
	}
}

func liveStatusLabel(status string) string {
	switch status {
	case "live":
		return "直播中"
	case "replay":
		return "回放"
	case "ended":
		return "已结束"
	default:
		return "未开始"
	}
}

func liveActionText(status string) string {
	switch status {
	case "live":
		return "进入直播间"
	case "replay":
		return "观看回放"
	case "ended":
		return "回放准备中"
	default:
		return "查看详情"
	}
}

func liveSchedule(status string, event domain.LiveEvent) string {
	switch status {
	case "live":
		return "正在直播中"
	case "replay":
		return "回放已开放"
	}

	startAt, startErr := time.Parse(time.RFC3339, event.StartAt)
	endAt, endErr := time.Parse(time.RFC3339, event.EndAt)
	if startErr != nil || endErr != nil {
		return ""
	}
	return fmt.Sprintf("%s - %s", startAt.Format("01-02 15:04"), endAt.Format("15:04"))
}

func liveDuration(event domain.LiveEvent) string {
	startAt, startErr := time.Parse(time.RFC3339, event.StartAt)
	endAt, endErr := time.Parse(time.RFC3339, event.EndAt)
	if startErr != nil || endErr != nil || !endAt.After(startAt) {
		return ""
	}
	return fmt.Sprintf("预计 %d 分钟", int(endAt.Sub(startAt).Minutes()))
}

func liveStateDeniedReason(effectiveStatus string, mode string) string {
	if mode == "replay" {
		switch effectiveStatus {
		case "upcoming":
			return "直播尚未开始"
		case "live":
			return "直播正在进行中，回放暂未开放"
		default:
			return "回放暂未开放"
		}
	}

	switch effectiveStatus {
	case "upcoming":
		return "直播尚未开始"
	case "replay":
		return "直播已结束，请观看回放"
	case "ended":
		return "直播已结束"
	default:
		return "当前直播不可观看"
	}
}

func requiredAccessForLiveDetail(detail domain.LiveDetail, visibility string) domain.LiveRequiredAccess {
	requiredAccess := detail.RequiredAccess
	if requiredAccess.Type == "" {
		requiredAccess.Type = visibility
	}
	if requiredAccess.ID == 0 {
		requiredAccess.ID = detail.VisibilityRefID
	}
	if strings.TrimSpace(requiredAccess.Title) == "" {
		requiredAccess.Title = liveRequiredAccessTitle(requiredAccess.Type)
	}
	return requiredAccess
}

func liveRequiredAccessTitle(accessType string) string {
	switch accessType {
	case "course":
		return "指定课程"
	case "bootcamp":
		return "指定训练营"
	case "member":
		return "年度会员计划"
	default:
		return "全部用户"
	}
}
