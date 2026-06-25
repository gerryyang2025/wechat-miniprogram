package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"private-domain-operation/backend/internal/domain"
)

func TestValidateLiveEditRejectsInvalidPayloads(t *testing.T) {
	t.Parallel()

	valid := validLiveEditPayload()
	tests := []struct {
		name      string
		mutate    func(*domain.LiveEditPayload)
		wantError bool
	}{
		{
			name: "missing title",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.Title = " "
			},
			wantError: true,
		},
		{
			name: "bad start time",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.StartAt = "tomorrow evening"
			},
			wantError: true,
		},
		{
			name: "bad end time",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.EndAt = "bad-time"
			},
			wantError: true,
		},
		{
			name: "end before start",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.EndAt = "2026-06-25T19:00:00+08:00"
			},
			wantError: true,
		},
		{
			name: "invalid status",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.StatusOverride = "paused"
			},
			wantError: true,
		},
		{
			name: "non canonical status",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.StatusOverride = "Live "
			},
			wantError: true,
		},
		{
			name: "http cover url",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.CoverURL = "http://media.example.com/cover.jpg"
			},
			wantError: true,
		},
		{
			name: "http live url",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.LiveURL = "http://media.example.com/live.m3u8"
			},
			wantError: true,
		},
		{
			name: "http replay url",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.ReplayURL = "http://media.example.com/replay.mp4"
			},
			wantError: true,
		},
		{
			name: "invalid visibility",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.Visibility = "vip"
			},
			wantError: true,
		},
		{
			name: "non canonical visibility",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.Visibility = "Course "
				payload.VisibilityRefID = 7
			},
			wantError: true,
		},
		{
			name: "blank visibility",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.Visibility = " "
			},
			wantError: true,
		},
		{
			name: "course without ref",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.Visibility = "course"
				payload.VisibilityRefID = 0
			},
			wantError: true,
		},
		{
			name: "valid all visibility with ref 0",
			mutate: func(payload *domain.LiveEditPayload) {
				payload.Visibility = "all"
				payload.VisibilityRefID = 0
			},
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := valid
			tt.mutate(&payload)

			err := validateLiveEdit(payload)
			if tt.wantError {
				if !errors.Is(err, ErrLiveValidation) {
					t.Fatalf("validateLiveEdit error = %v, want ErrLiveValidation", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("validateLiveEdit returned error: %v", err)
			}
		})
	}
}

func TestEffectiveLiveStatus(t *testing.T) {
	t.Parallel()

	now := mustParseLiveTestTime(t, "2026-06-25T20:30:00+08:00")
	tests := []struct {
		name  string
		event domain.LiveEvent
		want  string
	}{
		{
			name: "upcoming",
			event: domain.LiveEvent{
				StartAt: "2026-06-25T21:00:00+08:00",
				EndAt:   "2026-06-25T22:00:00+08:00",
			},
			want: "upcoming",
		},
		{
			name: "live",
			event: domain.LiveEvent{
				StartAt: "2026-06-25T20:00:00+08:00",
				EndAt:   "2026-06-25T21:00:00+08:00",
			},
			want: "live",
		},
		{
			name: "ended without replay",
			event: domain.LiveEvent{
				StartAt:       "2026-06-25T18:00:00+08:00",
				EndAt:         "2026-06-25T19:00:00+08:00",
				ReplayEnabled: true,
			},
			want: "ended",
		},
		{
			name: "replay after end when enabled and url exists",
			event: domain.LiveEvent{
				StartAt:       "2026-06-25T18:00:00+08:00",
				EndAt:         "2026-06-25T19:00:00+08:00",
				ReplayEnabled: true,
				ReplayURL:     "https://media.example.com/replay.mp4",
			},
			want: "replay",
		},
		{
			name: "override wins",
			event: domain.LiveEvent{
				StartAt:        "2026-06-25T18:00:00+08:00",
				EndAt:          "2026-06-25T19:00:00+08:00",
				StatusOverride: "live",
			},
			want: "live",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := effectiveLiveStatus(tt.event, now); got != tt.want {
				t.Fatalf("effectiveLiveStatus = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestLiveServiceListDecoratesAndFiltersByEffectiveStatus(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := &fakeLiveStore{
		listEvents: []domain.LiveEvent{
			liveTestEvent(1, "Raw upcoming", "upcoming", "2026-06-25T21:00:00+08:00", "2026-06-25T22:00:00+08:00"),
			liveTestEvent(2, "Raw ended but effectively live", "ended", "2026-06-25T20:00:00+08:00", "2026-06-25T21:00:00+08:00"),
			func() domain.LiveEvent {
				event := liveTestEvent(3, "Replay", "ended", "2026-06-25T18:00:00+08:00", "2026-06-25T19:00:00+08:00")
				event.ReplayEnabled = true
				event.ReplayURL = "https://media.example.com/replay.mp4"
				return event
			}(),
		},
	}
	service := NewLiveService(store)
	service.now = func() time.Time {
		return mustParseLiveTestTime(t, "2026-06-25T20:30:00+08:00")
	}

	events, err := service.ListLiveEvents(ctx, "")
	if err != nil {
		t.Fatalf("ListLiveEvents all returned error: %v", err)
	}
	if len(events) != 3 {
		t.Fatalf("all events length = %d, want 3", len(events))
	}
	if store.listFilters[0].Status != "all" {
		t.Fatalf("store all filter status = %q, want all", store.listFilters[0].Status)
	}
	assertLiveDecorated(t, events[0], "upcoming", "未开始", "06-25 21:00 - 22:00", "预计 60 分钟", "查看详情")
	assertLiveDecorated(t, events[1], "live", "直播中", "正在直播中", "预计 60 分钟", "进入直播间")
	assertLiveDecorated(t, events[2], "replay", "回放", "回放已开放", "预计 60 分钟", "观看回放")
	if events[1].Status != "live" {
		t.Fatalf("decorated event status = %q, want effective live", events[1].Status)
	}

	liveEvents, err := service.ListLiveEvents(ctx, "live")
	if err != nil {
		t.Fatalf("ListLiveEvents live returned error: %v", err)
	}
	if len(liveEvents) != 1 || liveEvents[0].ID != 2 {
		t.Fatalf("live events = %#v, want only event 2", liveEvents)
	}
	if store.listFilters[1].Status != "all" {
		t.Fatalf("store live filter status = %q, want all", store.listFilters[1].Status)
	}

	replayEvents, err := service.ListLiveEvents(ctx, "replay")
	if err != nil {
		t.Fatalf("ListLiveEvents replay returned error: %v", err)
	}
	if len(replayEvents) != 1 || replayEvents[0].ID != 3 {
		t.Fatalf("replay events = %#v, want only event 3", replayEvents)
	}
	if store.listFilters[2].Status != "all" {
		t.Fatalf("store replay filter status = %q, want all", store.listFilters[2].Status)
	}

	unknownEvents, err := service.ListLiveEvents(ctx, "archived")
	if err != nil {
		t.Fatalf("ListLiveEvents unknown returned error: %v", err)
	}
	if len(unknownEvents) != 3 {
		t.Fatalf("unknown status events length = %d, want 3", len(unknownEvents))
	}
	if store.listFilters[3].Status != "all" {
		t.Fatalf("store unknown filter status = %q, want all", store.listFilters[3].Status)
	}
}

func TestLiveAccessDecisionUsesGrants(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	detail := domain.LiveDetail{
		LiveEvent: domain.LiveEvent{
			ID:              11,
			Title:           "Course live",
			StartAt:         "2026-06-25T20:00:00+08:00",
			EndAt:           "2026-06-25T21:00:00+08:00",
			LiveURL:         "https://media.example.com/live.m3u8",
			Visibility:      "course",
			VisibilityRefID: 7,
		},
		RequiredAccess: domain.LiveRequiredAccess{Type: "course", ID: 7, Title: "AIGC 视频制作"},
	}

	allowedStore := &fakeLiveStore{detail: detail, grantAllowed: true}
	allowedService := liveServiceAt(t, allowedStore, "2026-06-25T20:30:00+08:00")
	decision, err := allowedService.CheckAccess(ctx, 101, 11, "live")
	if err != nil {
		t.Fatalf("CheckAccess allowed returned error: %v", err)
	}
	if !decision.Allowed {
		t.Fatalf("decision allowed = false, reason = %q", decision.Reason)
	}
	if decision.Mode != "live" || decision.TargetURL != "https://media.example.com/live.m3u8" {
		t.Fatalf("decision = %#v, want live target", decision)
	}
	if decision.OpenMethod != "web_view" || decision.FallbackAction != "copy_link" {
		t.Fatalf("decision methods = %#v", decision)
	}
	if len(allowedStore.grantCalls) != 1 {
		t.Fatalf("grant calls = %d, want 1", len(allowedStore.grantCalls))
	}
	if got := allowedStore.grantCalls[0]; got.userID != 101 || got.accessType != "course" || got.accessRefID != 7 {
		t.Fatalf("grant call = %#v, want user 101 course 7", got)
	}

	deniedStore := &fakeLiveStore{detail: detail, grantAllowed: false}
	deniedService := liveServiceAt(t, deniedStore, "2026-06-25T20:30:00+08:00")
	decision, err = deniedService.CheckAccess(ctx, 101, 11, "live")
	if err != nil {
		t.Fatalf("CheckAccess denied returned error: %v", err)
	}
	if decision.Allowed {
		t.Fatalf("decision allowed = true, want false")
	}
	if decision.Reason != "暂无观看权限" {
		t.Fatalf("denied reason = %q, want 暂无观看权限", decision.Reason)
	}
	if decision.RequiredAccess.Type != "course" || decision.RequiredAccess.ID != 7 || decision.RequiredAccess.Title != "AIGC 视频制作" {
		t.Fatalf("required access = %#v, want course 7", decision.RequiredAccess)
	}
}

func TestLiveAccessDecisionHandlesPublicReplayStateAndMissingLinks(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	publicStore := &fakeLiveStore{
		detail: domain.LiveDetail{LiveEvent: domain.LiveEvent{
			ID:         21,
			Title:      "Public live",
			StartAt:    "2026-06-25T20:00:00+08:00",
			EndAt:      "2026-06-25T21:00:00+08:00",
			LiveURL:    " https://media.example.com/public-live.m3u8 ",
			Visibility: "all",
		}},
	}
	publicService := liveServiceAt(t, publicStore, "2026-06-25T20:30:00+08:00")
	decision, err := publicService.CheckAccess(ctx, 202, 21, "")
	if err != nil {
		t.Fatalf("CheckAccess public returned error: %v", err)
	}
	if !decision.Allowed || decision.Mode != "live" {
		t.Fatalf("public decision = %#v, want allowed live", decision)
	}
	if decision.TargetURL != "https://media.example.com/public-live.m3u8" {
		t.Fatalf("public target url = %q, want trimmed https url", decision.TargetURL)
	}
	if len(publicStore.grantCalls) != 0 {
		t.Fatalf("public grant calls = %d, want 0", len(publicStore.grantCalls))
	}

	replayStore := &fakeLiveStore{
		detail: domain.LiveDetail{LiveEvent: domain.LiveEvent{
			ID:            22,
			Title:         "Replay",
			StartAt:       "2026-06-25T18:00:00+08:00",
			EndAt:         "2026-06-25T19:00:00+08:00",
			ReplayEnabled: true,
			ReplayURL:     "https://media.example.com/replay.mp4",
			Visibility:    "all",
		}},
	}
	replayService := liveServiceAt(t, replayStore, "2026-06-25T20:30:00+08:00")
	decision, err = replayService.CheckAccess(ctx, 202, 22, "")
	if err != nil {
		t.Fatalf("CheckAccess replay returned error: %v", err)
	}
	if !decision.Allowed || decision.Mode != "replay" || decision.TargetURL != "https://media.example.com/replay.mp4" {
		t.Fatalf("replay decision = %#v, want replay target", decision)
	}

	upcomingStore := &fakeLiveStore{
		detail: domain.LiveDetail{LiveEvent: domain.LiveEvent{
			ID:         23,
			Title:      "Upcoming",
			StartAt:    "2026-06-25T21:00:00+08:00",
			EndAt:      "2026-06-25T22:00:00+08:00",
			LiveURL:    "https://media.example.com/upcoming.m3u8",
			Visibility: "all",
		}},
	}
	upcomingService := liveServiceAt(t, upcomingStore, "2026-06-25T20:30:00+08:00")
	decision, err = upcomingService.CheckAccess(ctx, 202, 23, "live")
	if err != nil {
		t.Fatalf("CheckAccess upcoming returned error: %v", err)
	}
	if decision.Allowed || decision.Reason != "直播尚未开始" {
		t.Fatalf("upcoming decision = %#v, want state denial", decision)
	}

	missingURLStore := &fakeLiveStore{
		detail: domain.LiveDetail{LiveEvent: domain.LiveEvent{
			ID:         24,
			Title:      "Missing link",
			StartAt:    "2026-06-25T20:00:00+08:00",
			EndAt:      "2026-06-25T21:00:00+08:00",
			Visibility: "all",
		}},
	}
	missingURLService := liveServiceAt(t, missingURLStore, "2026-06-25T20:30:00+08:00")
	decision, err = missingURLService.CheckAccess(ctx, 202, 24, "live")
	if err != nil {
		t.Fatalf("CheckAccess missing url returned error: %v", err)
	}
	if decision.Allowed || decision.Reason != "直播链接暂未配置" {
		t.Fatalf("missing url decision = %#v, want link missing denial", decision)
	}

	httpURLStore := &fakeLiveStore{
		detail: domain.LiveDetail{LiveEvent: domain.LiveEvent{
			ID:         25,
			Title:      "HTTP link",
			StartAt:    "2026-06-25T20:00:00+08:00",
			EndAt:      "2026-06-25T21:00:00+08:00",
			LiveURL:    "http://media.example.com/live.m3u8",
			Visibility: "all",
		}},
	}
	httpURLService := liveServiceAt(t, httpURLStore, "2026-06-25T20:30:00+08:00")
	decision, err = httpURLService.CheckAccess(ctx, 202, 25, "live")
	if err != nil {
		t.Fatalf("CheckAccess http url returned error: %v", err)
	}
	if decision.Allowed || decision.Reason != "直播链接暂未配置" {
		t.Fatalf("http url decision = %#v, want link missing denial", decision)
	}
}

func TestLiveServiceDelegatesEditAndAccessOptions(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	payload := validLiveEditPayload()
	store := &fakeLiveStore{
		edit:         payload,
		createResult: withLiveEditID(payload, 31),
		updateResult: withLiveEditID(payload, 32),
		options: domain.LiveAccessOptions{
			Courses: []domain.LiveAccessOption{{Type: "course", ID: 1, Title: "AIGC 视频制作"}},
		},
	}
	service := NewLiveService(store)

	edit, err := service.GetLiveEdit(ctx, 31)
	if err != nil {
		t.Fatalf("GetLiveEdit returned error: %v", err)
	}
	if edit.Title != payload.Title || len(store.editIDs) != 1 || store.editIDs[0] != 31 {
		t.Fatalf("edit = %#v, edit IDs = %#v", edit, store.editIDs)
	}

	created, err := service.CreateLiveEvent(ctx, 3, payload)
	if err != nil {
		t.Fatalf("CreateLiveEvent returned error: %v", err)
	}
	if created.ID != 31 || len(store.createMerchantIDs) != 1 || store.createMerchantIDs[0] != 3 {
		t.Fatalf("created = %#v, merchant IDs = %#v", created, store.createMerchantIDs)
	}
	if len(store.createPayloads) != 1 || store.createPayloads[0].Title != payload.Title {
		t.Fatalf("create payloads = %#v", store.createPayloads)
	}

	updated, err := service.UpdateLiveEvent(ctx, 32, 3, payload)
	if err != nil {
		t.Fatalf("UpdateLiveEvent returned error: %v", err)
	}
	if updated.ID != 32 || len(store.updateIDs) != 1 || store.updateIDs[0] != 32 {
		t.Fatalf("updated = %#v, update IDs = %#v", updated, store.updateIDs)
	}

	options, err := service.GetAccessOptions(ctx, 7)
	if err != nil {
		t.Fatalf("GetAccessOptions returned error: %v", err)
	}
	if len(options.Courses) != 1 || options.Courses[0].ID != 1 {
		t.Fatalf("options = %#v", options)
	}
	if len(store.optionsMerchantIDs) != 1 || store.optionsMerchantIDs[0] != 7 {
		t.Fatalf("options merchant IDs = %#v, want [7]", store.optionsMerchantIDs)
	}

	invalidPayload := payload
	invalidPayload.Title = ""
	_, err = service.CreateLiveEvent(ctx, 3, invalidPayload)
	if !errors.Is(err, ErrLiveValidation) {
		t.Fatalf("CreateLiveEvent invalid error = %v, want ErrLiveValidation", err)
	}
	if len(store.createPayloads) != 1 {
		t.Fatalf("invalid create delegated, create payloads = %#v", store.createPayloads)
	}

	nilService := NewLiveService(nil)
	if _, err := nilService.ListLiveEvents(ctx, "all"); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("ListLiveEvents nil error = %v, want ErrLiveStoreRequired", err)
	}
	if _, err := nilService.GetLiveDetail(ctx, 1); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("GetLiveDetail nil error = %v, want ErrLiveStoreRequired", err)
	}
	if _, err := nilService.GetLiveEdit(ctx, 1); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("GetLiveEdit nil error = %v, want ErrLiveStoreRequired", err)
	}
	if _, err := nilService.CreateLiveEvent(ctx, 1, payload); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("CreateLiveEvent nil error = %v, want ErrLiveStoreRequired", err)
	}
	if _, err := nilService.UpdateLiveEvent(ctx, 1, 1, payload); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("UpdateLiveEvent nil error = %v, want ErrLiveStoreRequired", err)
	}
	if _, err := nilService.GetAccessOptions(ctx, 1); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("GetAccessOptions nil error = %v, want ErrLiveStoreRequired", err)
	}
	if _, err := nilService.CheckAccess(ctx, 1, 1, "live"); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("CheckAccess nil error = %v, want ErrLiveStoreRequired", err)
	}
}

func TestLiveServiceValidatesVisibilityOwnershipBeforeSaving(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	payload := validLiveEditPayload()
	payload.Visibility = "course"
	payload.VisibilityRefID = 20

	store := &fakeLiveStore{
		visibilityOwned: false,
		createResult:    withLiveEditID(payload, 31),
		updateResult:    withLiveEditID(payload, 32),
	}
	service := NewLiveService(store)

	if _, err := service.CreateLiveEvent(ctx, 3, payload); !errors.Is(err, ErrLiveValidation) {
		t.Fatalf("CreateLiveEvent foreign ref error = %v, want ErrLiveValidation", err)
	}
	if len(store.createPayloads) != 0 {
		t.Fatalf("foreign ref create delegated, create payloads = %#v", store.createPayloads)
	}
	if _, err := service.UpdateLiveEvent(ctx, 32, 3, payload); !errors.Is(err, ErrLiveValidation) {
		t.Fatalf("UpdateLiveEvent foreign ref error = %v, want ErrLiveValidation", err)
	}
	if len(store.updatePayloads) != 0 {
		t.Fatalf("foreign ref update delegated, update payloads = %#v", store.updatePayloads)
	}

	store.visibilityOwned = true
	if _, err := service.CreateLiveEvent(ctx, 3, payload); err != nil {
		t.Fatalf("CreateLiveEvent owned ref returned error: %v", err)
	}
	if _, err := service.UpdateLiveEvent(ctx, 32, 3, payload); err != nil {
		t.Fatalf("UpdateLiveEvent owned ref returned error: %v", err)
	}
	if len(store.visibilityChecks) != 4 {
		t.Fatalf("visibility checks = %#v, want 4 calls", store.visibilityChecks)
	}
}

func TestLiveServiceMerchantIDForUserDelegatesAndRequiresStore(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := &fakeLiveStore{merchantID: 42}
	service := NewLiveService(store)

	merchantID, err := service.MerchantIDForUser(ctx, 101)
	if err != nil {
		t.Fatalf("MerchantIDForUser returned error: %v", err)
	}
	if merchantID != 42 {
		t.Fatalf("merchantID = %d, want 42", merchantID)
	}
	if len(store.merchantUserIDs) != 1 || store.merchantUserIDs[0] != 101 {
		t.Fatalf("merchant user IDs = %#v, want [101]", store.merchantUserIDs)
	}

	nilService := NewLiveService(nil)
	if _, err := nilService.MerchantIDForUser(ctx, 101); !errors.Is(err, ErrLiveStoreRequired) {
		t.Fatalf("MerchantIDForUser nil error = %v, want ErrLiveStoreRequired", err)
	}
}

type fakeLiveStore struct {
	listEvents  []domain.LiveEvent
	listErr     error
	listFilters []domain.LiveListFilter

	detail    domain.LiveDetail
	detailErr error
	detailIDs []int64

	edit    domain.LiveEditPayload
	editErr error
	editIDs []int64

	createResult      domain.LiveEditPayload
	createErr         error
	createMerchantIDs []int64
	createPayloads    []domain.LiveEditPayload

	updateResult   domain.LiveEditPayload
	updateErr      error
	updateIDs      []int64
	updatePayloads []domain.LiveEditPayload

	grantAllowed bool
	grantErr     error
	grantCalls   []fakeLiveGrantCall

	visibilityOwned  bool
	visibilityErr    error
	visibilityChecks []fakeLiveVisibilityCheck

	options            domain.LiveAccessOptions
	optionsErr         error
	optionsMerchantIDs []int64

	merchantID      int64
	merchantIDErr   error
	merchantUserIDs []int64
}

type fakeLiveGrantCall struct {
	userID      int64
	accessType  string
	accessRefID int64
}

type fakeLiveVisibilityCheck struct {
	merchantID int64
	visibility string
	refID      int64
}

func (s *fakeLiveStore) ListLiveEvents(ctx context.Context, filter domain.LiveListFilter) ([]domain.LiveEvent, error) {
	s.listFilters = append(s.listFilters, filter)
	if s.listErr != nil {
		return nil, s.listErr
	}
	return append([]domain.LiveEvent(nil), s.listEvents...), nil
}

func (s *fakeLiveStore) GetLiveDetail(ctx context.Context, liveID int64) (domain.LiveDetail, error) {
	s.detailIDs = append(s.detailIDs, liveID)
	if s.detailErr != nil {
		return domain.LiveDetail{}, s.detailErr
	}
	return s.detail, nil
}

func (s *fakeLiveStore) GetLiveEdit(ctx context.Context, liveID int64) (domain.LiveEditPayload, error) {
	s.editIDs = append(s.editIDs, liveID)
	if s.editErr != nil {
		return domain.LiveEditPayload{}, s.editErr
	}
	return s.edit, nil
}

func (s *fakeLiveStore) CreateLiveEvent(ctx context.Context, merchantID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	s.createMerchantIDs = append(s.createMerchantIDs, merchantID)
	s.createPayloads = append(s.createPayloads, payload)
	if s.createErr != nil {
		return domain.LiveEditPayload{}, s.createErr
	}
	return s.createResult, nil
}

func (s *fakeLiveStore) UpdateLiveEvent(ctx context.Context, liveID int64, payload domain.LiveEditPayload) (domain.LiveEditPayload, error) {
	s.updateIDs = append(s.updateIDs, liveID)
	s.updatePayloads = append(s.updatePayloads, payload)
	if s.updateErr != nil {
		return domain.LiveEditPayload{}, s.updateErr
	}
	return s.updateResult, nil
}

func (s *fakeLiveStore) VisibilityRefBelongsToMerchant(ctx context.Context, merchantID int64, visibility string, refID int64) (bool, error) {
	s.visibilityChecks = append(s.visibilityChecks, fakeLiveVisibilityCheck{
		merchantID: merchantID,
		visibility: visibility,
		refID:      refID,
	})
	if s.visibilityErr != nil {
		return false, s.visibilityErr
	}
	return s.visibilityOwned, nil
}

func (s *fakeLiveStore) HasActiveGrant(ctx context.Context, userID int64, accessType string, accessRefID int64) (bool, error) {
	s.grantCalls = append(s.grantCalls, fakeLiveGrantCall{
		userID:      userID,
		accessType:  accessType,
		accessRefID: accessRefID,
	})
	if s.grantErr != nil {
		return false, s.grantErr
	}
	return s.grantAllowed, nil
}

func (s *fakeLiveStore) GetAccessOptions(ctx context.Context, merchantID int64) (domain.LiveAccessOptions, error) {
	s.optionsMerchantIDs = append(s.optionsMerchantIDs, merchantID)
	if s.optionsErr != nil {
		return domain.LiveAccessOptions{}, s.optionsErr
	}
	return s.options, nil
}

func (s *fakeLiveStore) MerchantIDForUser(ctx context.Context, userID int64) (int64, error) {
	s.merchantUserIDs = append(s.merchantUserIDs, userID)
	if s.merchantIDErr != nil {
		return 0, s.merchantIDErr
	}
	return s.merchantID, nil
}

func validLiveEditPayload() domain.LiveEditPayload {
	return domain.LiveEditPayload{
		Title:           "私域运营直播答疑",
		Summary:         "围绕社群转化和直播复盘。",
		Speaker:         "Gerry",
		CoverURL:        "https://media.example.com/covers/live.jpg",
		StartAt:         "2026-06-25T20:00:00+08:00",
		EndAt:           "2026-06-25T21:00:00+08:00",
		StatusOverride:  "",
		LiveURL:         "https://media.example.com/live/session.m3u8",
		ReplayURL:       "https://media.example.com/replay/session.mp4",
		Visibility:      "all",
		VisibilityRefID: 0,
		ReplayEnabled:   true,
	}
}

func withLiveEditID(payload domain.LiveEditPayload, id int64) domain.LiveEditPayload {
	payload.ID = id
	return payload
}

func liveTestEvent(id int64, title string, status string, startAt string, endAt string) domain.LiveEvent {
	return domain.LiveEvent{
		ID:         id,
		PublicID:   title,
		Title:      title,
		Status:     status,
		StartAt:    startAt,
		EndAt:      endAt,
		LiveURL:    "https://media.example.com/live.m3u8",
		Visibility: "all",
	}
}

func liveServiceAt(t *testing.T, store LiveStore, nowValue string) *LiveService {
	t.Helper()

	service := NewLiveService(store)
	service.now = func() time.Time {
		return mustParseLiveTestTime(t, nowValue)
	}
	return service
}

func mustParseLiveTestTime(t *testing.T, value string) time.Time {
	t.Helper()

	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		t.Fatalf("parse test time %q: %v", value, err)
	}
	return parsed
}

func assertLiveDecorated(t *testing.T, event domain.LiveEvent, status string, label string, schedule string, duration string, action string) {
	t.Helper()

	if event.EffectiveStatus != status {
		t.Fatalf("event %d effective status = %q, want %q", event.ID, event.EffectiveStatus, status)
	}
	if event.Status != status {
		t.Fatalf("event %d status = %q, want %q", event.ID, event.Status, status)
	}
	if event.StatusLabel != label {
		t.Fatalf("event %d status label = %q, want %q", event.ID, event.StatusLabel, label)
	}
	if event.Schedule != schedule {
		t.Fatalf("event %d schedule = %q, want %q", event.ID, event.Schedule, schedule)
	}
	if event.Duration != duration {
		t.Fatalf("event %d duration = %q, want %q", event.ID, event.Duration, duration)
	}
	if event.ActionText != action {
		t.Fatalf("event %d action text = %q, want %q", event.ID, event.ActionText, action)
	}
}
