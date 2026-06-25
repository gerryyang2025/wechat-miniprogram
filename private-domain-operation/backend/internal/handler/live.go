package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/service"
)

type liveAccessRequest struct {
	Mode string `json:"mode"`
}

func handleLiveList(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		status := c.DefaultQuery("status", "all")
		events, err := lives.ListLiveEvents(c.Request.Context(), status)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		items := make([]gin.H, 0, len(events))
		for _, event := range events {
			items = append(items, liveListResponseItem(event))
		}

		ok(c, gin.H{
			"navSubtitle": "查看即将开始、直播中与回放内容",
			"filterTabs":  liveFilterTabs(),
			"activeTab":   normalizedLiveStatusTab(status),
			"emptyHint":   "当前暂无对应直播内容。",
			"liveList":    items,
		})
	}
}

func handleLiveDetail(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		liveID, valid := parseLiveIDParam(c)
		if !valid {
			return
		}

		detail, err := lives.GetLiveDetail(c.Request.Context(), liveID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		mode := normalizedLiveDetailMode(c.DefaultQuery("mode", detail.EffectiveStatus), detail.EffectiveStatus)
		isReplay := mode == "replay"
		roomMode := "live"
		if isReplay {
			roomMode = "replay"
		}
		escapedTitle := url.QueryEscape(detail.Title)

		ok(c, gin.H{
			"live":                  publicLiveDetail(detail),
			"mode":                  mode,
			"isReplay":              isReplay,
			"statusText":            liveModeStatusText(mode, detail),
			"navSubtitle":           liveDetailNavSubtitle(isReplay),
			"statusPanelTitle":      liveStatusPanelTitle(mode),
			"statusPanelTag":        liveStatusPanelTag(detail),
			"statusPanelSummary":    "建议提前确认观看环境，直播结束后可按重点片段复盘。",
			"statusPanelItems":      detail.AccessRules,
			"sectionHighlightTitle": liveHighlightTitle(isReplay),
			"primaryActionText":     livePrimaryActionText(isReplay),
			"secondaryActionText":   liveSecondaryActionText(isReplay),
			"posterActionText":      "保存海报",
			"posterSavingText":      "保存中",
			"posterMessages":        gin.H{"generatingTitle": "海报生成中", "savingTitle": "正在保存", "successTitle": "海报已保存", "failureTitle": "海报保存失败"},
			"primaryEntry":          pageEntry("/pages/live-room/live-room?liveId=" + strconv.FormatInt(liveID, 10) + "&mode=" + roomMode + "&title=" + escapedTitle),
			"secondaryEntry":        pageEntry("/pages/consultation/consultation?scene=live&title=" + escapedTitle),
		})
	}
}

func handleLiveRoom(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		liveID, valid := parseLiveIDParam(c)
		if !valid {
			return
		}

		detail, err := lives.GetLiveDetail(c.Request.Context(), liveID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		mode := normalizedLiveRoomMode(c.DefaultQuery("mode", detail.EffectiveStatus), detail.EffectiveStatus)
		isReplay := mode == "replay"
		title := strings.TrimSpace(c.Query("title"))
		if title == "" {
			title = detail.Title
		}

		ok(c, gin.H{
			"liveId": strconv.FormatInt(liveID, 10),
			"title":  title,
			"mode":   mode,
			"live":   publicLiveDetail(detail),
			"statusText": func() string {
				if isReplay {
					return "回放中"
				}
				if detail.EffectiveStatus == "upcoming" {
					return "直播尚未开始"
				}
				if detail.EffectiveStatus == "ended" {
					return "直播已结束"
				}
				return "直播中"
			}(),
			"statusTheme": func() string {
				if isReplay {
					return "replay"
				}
				return "live"
			}(),
			"audienceText": detail.Audience,
			"topic":        detail.Intro,
			"notice":       "进入直播或回放前会校验当前账号权限。",
			"messages": []gin.H{
				{"id": "msg-1", "user": "时昕同学", "text": "训练营内容和直播节奏怎么衔接？"},
				{"id": "msg-2", "user": detail.Speaker, "text": "稍后重点讲联动节奏。"},
			},
			"replayProgress": func() string {
				if isReplay {
					return "回放已开放"
				}
				return ""
			}(),
			"replaySummary": func() string {
				if isReplay {
					return strings.Join(detail.ReplaySupport, "；")
				}
				return ""
			}(),
			"replayHighlights": detail.Highlights,
			"inputPlaceholder": func() string {
				if isReplay {
					return "记录回放笔记或复盘想法"
				}
				return "输入问题或记录想法"
			}(),
			"actionLabel": func() string {
				if isReplay {
					return "记笔记"
				}
				return "去提问"
			}(),
			"askFeedback": func() string {
				if isReplay {
					return "笔记功能后续接入"
				}
				return "提问功能后续接入"
			}(),
		})
	}
}

func handleLiveAccessCheck(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		liveID, valid := parseLiveIDParam(c)
		if !valid {
			return
		}

		var req liveAccessRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			errorJSON(c, http.StatusBadRequest, 40002, "invalid live access request")
			return
		}

		userID, validUser := currentDBUserID(c)
		if !validUser {
			return
		}

		decision, err := lives.CheckAccess(c.Request.Context(), userID, liveID, req.Mode)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		ok(c, decision)
	}
}

func handleMerchantLiveEvents(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		merchantID, scoped := merchantIDForLiveRequest(c, lives)
		if !scoped {
			return
		}

		status := c.DefaultQuery("status", "all")
		events, err := lives.ListLiveEvents(c.Request.Context(), status)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		items := make([]gin.H, 0, len(events))
		for _, event := range events {
			if event.MerchantID != merchantID {
				continue
			}
			items = append(items, merchantLiveListItem(event))
		}

		ok(c, gin.H{
			"pageHint":       "管理直播场次、观看范围和回放链接。",
			"filterTabs":     []gin.H{{"key": "all", "label": "全部"}, {"key": "upcoming", "label": "未开始"}, {"key": "live", "label": "直播中"}, {"key": "ended", "label": "已结束"}, {"key": "replay", "label": "回放"}},
			"activeTab":      normalizedLiveStatusTab(status),
			"createFeedback": "新建直播",
			"liveList":       items,
		})
	}
}

func handleMerchantLiveCreate(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		merchantID, scoped := merchantIDForLiveRequest(c, lives)
		if !scoped {
			return
		}

		var payload domain.LiveEditPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			errorJSON(c, http.StatusBadRequest, 40002, "invalid live edit request")
			return
		}

		saved, err := lives.CreateLiveEvent(c.Request.Context(), merchantID, payload)
		if err != nil {
			writeLiveSaveError(c, err)
			return
		}

		ok(c, saved)
	}
}

func handleMerchantLiveEdit(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		liveID, valid := parseLiveIDParam(c)
		if !valid {
			return
		}

		merchantID, scoped := merchantIDForLiveRequest(c, lives)
		if !scoped {
			return
		}
		if _, owned := loadMerchantLiveDetail(c, lives, liveID, merchantID); !owned {
			return
		}

		payload, err := lives.GetLiveEdit(c.Request.Context(), liveID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		ok(c, payload)
	}
}

func handleMerchantLiveUpdate(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		liveID, valid := parseLiveIDParam(c)
		if !valid {
			return
		}

		merchantID, scoped := merchantIDForLiveRequest(c, lives)
		if !scoped {
			return
		}
		if _, owned := loadMerchantLiveDetail(c, lives, liveID, merchantID); !owned {
			return
		}

		var payload domain.LiveEditPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			errorJSON(c, http.StatusBadRequest, 40002, "invalid live edit request")
			return
		}
		payload.ID = liveID

		saved, err := lives.UpdateLiveEvent(c.Request.Context(), liveID, payload)
		if err != nil {
			writeLiveSaveError(c, err)
			return
		}

		ok(c, saved)
	}
}

func handleMerchantAccessOptions(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		lives, available := liveServiceOrError(c, deps)
		if !available {
			return
		}

		merchantID, scoped := merchantIDForLiveRequest(c, lives)
		if !scoped {
			return
		}

		options, err := lives.GetAccessOptions(c.Request.Context(), merchantID)
		if err != nil {
			writeLiveLoadError(c, err)
			return
		}

		ok(c, options)
	}
}

func liveServiceOrError(c *gin.Context, deps Dependencies) (*service.LiveService, bool) {
	if deps.Live == nil {
		errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
		return nil, false
	}
	return deps.Live, true
}

func merchantIDForLiveRequest(c *gin.Context, lives *service.LiveService) (int64, bool) {
	userID, ok := currentDBUserID(c)
	if !ok {
		return 0, false
	}

	merchantID, err := lives.MerchantIDForUser(c.Request.Context(), userID)
	if err != nil {
		writeMerchantLiveScopeError(c, err)
		return 0, false
	}
	return merchantID, true
}

func loadMerchantLiveDetail(c *gin.Context, lives *service.LiveService, liveID int64, merchantID int64) (domain.LiveDetail, bool) {
	detail, err := lives.GetLiveDetail(c.Request.Context(), liveID)
	if err != nil {
		writeLiveLoadError(c, err)
		return domain.LiveDetail{}, false
	}
	if detail.MerchantID != merchantID {
		errorJSON(c, http.StatusNotFound, 40404, "live not found")
		return domain.LiveDetail{}, false
	}
	return detail, true
}

func parseLiveIDParam(c *gin.Context) (int64, bool) {
	liveID, err := strconv.ParseInt(c.Param("live_id"), 10, 64)
	if err != nil || liveID <= 0 {
		errorJSON(c, http.StatusBadRequest, 40003, "invalid live id")
		return 0, false
	}
	return liveID, true
}

func writeLiveLoadError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, sql.ErrNoRows):
		errorJSON(c, http.StatusNotFound, 40404, "live not found")
	case errors.Is(err, service.ErrLiveStoreRequired):
		errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
	default:
		errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
	}
}

func writeMerchantLiveScopeError(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		errorJSON(c, http.StatusForbidden, 40301, "merchant role required")
		return
	}
	errorJSON(c, http.StatusInternalServerError, 50004, "live service unavailable")
}

func writeLiveSaveError(c *gin.Context, err error) {
	if errors.Is(err, service.ErrLiveValidation) {
		errorJSON(c, http.StatusBadRequest, 40004, "invalid live edit request")
		return
	}
	writeLiveLoadError(c, err)
}

func liveListResponseItem(event domain.LiveEvent) gin.H {
	publicID := livePublicID(event)
	status := liveEffectiveStatus(event)
	return gin.H{
		"id":              publicID,
		"numericId":       event.ID,
		"status":          status,
		"effectiveStatus": status,
		"title":           event.Title,
		"speaker":         event.Speaker,
		"schedule":        event.Schedule,
		"audience":        event.Audience,
		"summary":         event.Summary,
		"note":            event.CoverHint,
		"coverUrl":        event.CoverURL,
		"coverHint":       event.CoverHint,
		"actionText":      event.ActionText,
		"statusLabel":     event.StatusLabel,
		"theme":           event.Theme,
		"entry":           pageEntry("/pages/live-detail/live-detail?liveId=" + publicID + "&mode=" + status),
	}
}

func merchantLiveListItem(event domain.LiveEvent) gin.H {
	publicID := livePublicID(event)
	status := liveEffectiveStatus(event)
	return gin.H{
		"id":             publicID,
		"numericId":      event.ID,
		"status":         status,
		"statusLabel":    event.StatusLabel,
		"title":          event.Title,
		"coverHint":      event.CoverHint,
		"schedule":       event.Schedule,
		"audience":       event.Audience,
		"actionText":     "编辑",
		"actionFeedback": "编辑 · " + event.Title,
		"theme":          event.Theme,
		"updatedAt":      event.UpdatedAt,
		"editEntry":      pageEntry("/pages/live-edit/live-edit?liveId=" + publicID),
	}
}

func publicLiveDetail(detail domain.LiveDetail) gin.H {
	status := liveEffectiveStatus(detail.LiveEvent)
	return gin.H{
		"id":              livePublicID(detail.LiveEvent),
		"numericId":       detail.ID,
		"title":           detail.Title,
		"speaker":         detail.Speaker,
		"coverUrl":        detail.CoverURL,
		"coverHint":       detail.CoverHint,
		"duration":        detail.Duration,
		"schedule":        detail.Schedule,
		"status":          status,
		"effectiveStatus": status,
		"statusLabel":     detail.StatusLabel,
		"viewers":         detail.Viewers,
		"intro":           detail.Intro,
		"summary":         detail.Summary,
		"audience":        detail.Audience,
		"accessRules":     detail.AccessRules,
		"highlights":      detail.Highlights,
		"replaySupport":   detail.ReplaySupport,
		"replayMoments":   detail.ReplayMoments,
		"teacherBio":      detail.TeacherBio,
		"requiredAccess":  detail.RequiredAccess,
		"replayEnabled":   detail.ReplayEnabled,
		"actionText":      detail.ActionText,
		"theme":           detail.Theme,
		"updatedAt":       detail.UpdatedAt,
	}
}

func liveFilterTabs() []gin.H {
	return []gin.H{
		{"key": "all", "label": "全部"},
		{"key": "upcoming", "label": "即将开始"},
		{"key": "live", "label": "直播中"},
		{"key": "replay", "label": "回放"},
	}
}

func livePublicID(event domain.LiveEvent) string {
	if strings.TrimSpace(event.PublicID) != "" {
		return event.PublicID
	}
	return strconv.FormatInt(event.ID, 10)
}

func liveEffectiveStatus(event domain.LiveEvent) string {
	if strings.TrimSpace(event.EffectiveStatus) != "" {
		return event.EffectiveStatus
	}
	if strings.TrimSpace(event.Status) != "" {
		return event.Status
	}
	return "upcoming"
}

func normalizedLiveStatusTab(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "upcoming", "live", "ended", "replay":
		return strings.ToLower(strings.TrimSpace(status))
	default:
		return "all"
	}
}

func normalizedLiveDetailMode(mode string, effectiveStatus string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	switch mode {
	case "upcoming", "live", "replay", "ended":
		return mode
	}
	return liveEffectiveStatus(domain.LiveEvent{Status: effectiveStatus, EffectiveStatus: effectiveStatus})
}

func normalizedLiveRoomMode(mode string, effectiveStatus string) string {
	mode = strings.ToLower(strings.TrimSpace(mode))
	if mode == "replay" {
		return "replay"
	}
	if mode == "live" {
		return "live"
	}
	if effectiveStatus == "replay" {
		return "replay"
	}
	return "live"
}

func liveModeStatusText(mode string, detail domain.LiveDetail) string {
	switch mode {
	case "live":
		if detail.EffectiveStatus == "live" {
			return "正在直播中"
		}
		return detail.StatusLabel
	case "replay":
		return "回放已开放"
	case "ended":
		return "直播已结束"
	default:
		if detail.Schedule != "" {
			return detail.Schedule
		}
		return "即将开始"
	}
}

func liveDetailNavSubtitle(isReplay bool) string {
	if isReplay {
		return "回放说明与复盘重点"
	}
	return "观看条件与直播看点"
}

func liveStatusPanelTitle(mode string) string {
	switch mode {
	case "replay":
		return "回放状态"
	case "live":
		return "直播提醒"
	case "ended":
		return "直播状态"
	default:
		return "开播提醒"
	}
}

func liveStatusPanelTag(detail domain.LiveDetail) string {
	if detail.ReplayEnabled {
		return "支持反复观看"
	}
	return detail.StatusLabel
}

func liveHighlightTitle(isReplay bool) string {
	if isReplay {
		return "回放重点"
	}
	return "本场看点"
}

func livePrimaryActionText(isReplay bool) string {
	if isReplay {
		return "查看回放"
	}
	return "进入直播间"
}

func liveSecondaryActionText(isReplay bool) string {
	if isReplay {
		return "咨询回放"
	}
	return "咨询直播"
}
