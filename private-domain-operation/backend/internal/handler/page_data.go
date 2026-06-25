package handler

import (
	"database/sql"
	"errors"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"

	"private-domain-operation/backend/internal/domain"
	"private-domain-operation/backend/internal/service"
)

type lessonDef struct {
	ID       string
	Title    string
	Duration string
}

type chapterDef struct {
	ID      string
	Title   string
	Summary string
	Lessons []lessonDef
}

type playerCourseDef struct {
	ID            string
	DetailID      string
	Title         string
	AccessType    string
	SourceLabel   string
	Description   string
	OutlineText   string
	CoverURL      string
	VideoURL      string
	Duration      string
	ResourceState string
	Chapters      []chapterDef
}

type progressState struct {
	CompletedLessons int
	TotalLessons     int
	LastPosition     string
	LastSeconds      int
	CurrentLessonID  string
}

const (
	seedSQLiteCourseID       int64 = 1
	seedStudentUserID        int64 = 2
	seedProductPublicID            = "course-aigc-video"
	seedPlayerCoursePublicID       = "player-aigc-video"
	seedLessonPublicPrefix         = "player-aigc-l"
)

var (
	progressMu       sync.Mutex
	progressByCourse = map[string]progressState{
		"player-ip-course": {
			CompletedLessons: 4,
			TotalLessons:     9,
			LastPosition:     "最近学习 第 4 节 内容成交链路拆解",
			CurrentLessonID:  "player-ip-l4",
		},
		"player-aigc-video": {
			CompletedLessons: 1,
			TotalLessons:     5,
			LastPosition:     "上次看到 03:22",
			LastSeconds:      202,
			CurrentLessonID:  "player-aigc-l2",
		},
		"player-wechat-game": {
			CompletedLessons: 2,
			TotalLessons:     4,
			LastPosition:     "最近完成 项目结构与资源组织",
			CurrentLessonID:  "player-wxgame-l3",
		},
	}
	progressByUserCourse = map[string]progressState{}
)

var playerCourses = map[string]playerCourseDef{
	"player-ip-course": {
		ID:            "player-ip-course",
		DetailID:      "course-1",
		Title:         "个人 IP 内容变现实战课",
		AccessType:    "purchased",
		SourceLabel:   "系列课",
		Description:   "聚焦个人 IP 的定位、选题、内容成交链路和私域承接节奏，帮助你建立系统的内容变现路径。",
		OutlineText:   "当前课程主线已接入到课程播放页，正式 COS 媒资资源待上传后替换。",
		CoverURL:      "/assets/home/banner1.jpg",
		VideoURL:      "",
		Duration:      "内容更新中",
		ResourceState: "preparing",
		Chapters: []chapterDef{
			{ID: "player-ip-chapter-1", Title: "模块 1 · 定位与内容起步", Lessons: []lessonDef{
				{ID: "player-ip-l1", Title: "第 1 节 个人品牌定位与优势梳理", Duration: "14:28"},
				{ID: "player-ip-l2", Title: "第 2 节 高转化选题的搭建方式", Duration: "12:16"},
				{ID: "player-ip-l3", Title: "第 3 节 内容表达结构与开场设计", Duration: "15:02"},
			}},
			{ID: "player-ip-chapter-2", Title: "模块 2 · 转化路径与私域承接", Lessons: []lessonDef{
				{ID: "player-ip-l4", Title: "第 4 节 内容成交链路拆解", Duration: "11:41"},
				{ID: "player-ip-l5", Title: "第 5 节 朋友圈内容节奏设计", Duration: "13:19"},
				{ID: "player-ip-l6", Title: "第 6 节 咨询承接与内容互动动作", Duration: "10:08"},
			}},
			{ID: "player-ip-chapter-3", Title: "模块 3 · 日常复盘与内容经营", Lessons: []lessonDef{
				{ID: "player-ip-l7", Title: "第 7 节 周更节奏与内容复盘", Duration: "09:56"},
				{ID: "player-ip-l8", Title: "第 8 节 产品化表达模板", Duration: "11:52"},
				{ID: "player-ip-l9", Title: "第 9 节 咨询服务的内容包装", Duration: "08:44"},
			}},
		},
	},
	"player-aigc-video": {
		ID:            "player-aigc-video",
		DetailID:      "course-aigc-video",
		Title:         "AIGC 视频制作",
		AccessType:    "purchased",
		SourceLabel:   "录播课程",
		Description:   "聚焦 AIGC 视频创作流程，从脚本构思、口播表达，到成片剪辑与发布节奏。",
		OutlineText:   "本节内容将快速带你了解 AIGC 视频制作的基础链路，包括选题、脚本组织、画面表达和成片发布。",
		CoverURL:      "/assets/home/banner1.jpg",
		VideoURL:      "https://media.w3.org/2010/05/sintel/trailer.mp4",
		Duration:      "03:22",
		ResourceState: "ready",
		Chapters: []chapterDef{
			{ID: "player-aigc-chapter-1", Title: "模块 1 · 从选题到脚本", Lessons: []lessonDef{
				{ID: "player-aigc-l1", Title: "第 1 节 AIGC 视频选题方向", Duration: "09:24"},
				{ID: "player-aigc-l2", Title: "第 2 节 AIGC 视频脚本拆解", Duration: "03:22"},
			}},
			{ID: "player-aigc-chapter-2", Title: "模块 2 · 口播与成片", Lessons: []lessonDef{
				{ID: "player-aigc-l3", Title: "第 3 节 口播结构与节奏", Duration: "08:11"},
				{ID: "player-aigc-l4", Title: "第 4 节 画面与字幕组织", Duration: "06:48"},
				{ID: "player-aigc-l5", Title: "第 5 节 发布与复盘动作", Duration: "07:35"},
			}},
		},
	},
	"player-wechat-game": {
		ID:            "player-wechat-game",
		DetailID:      "course-wechat-game",
		Title:         "微信小游戏开发",
		AccessType:    "purchased",
		SourceLabel:   "项目实战",
		Description:   "围绕微信小游戏实战，讲解项目结构、交互循环、资源组织与真机调试流程。",
		OutlineText:   "本节内容聚焦飞机大战小游戏示例，重点说明场景搭建、角色移动、碰撞检测、资源管理与发布调试。",
		CoverURL:      "/assets/home/banner2.jpg",
		VideoURL:      "http://106.55.160.81:8080/wechat-plane-game.mov",
		Duration:      "项目演示",
		ResourceState: "ready",
		Chapters: []chapterDef{
			{ID: "player-wxgame-chapter-1", Title: "模块 1 · 项目结构搭建", Lessons: []lessonDef{
				{ID: "player-wxgame-l1", Title: "第 1 节 小游戏初始化与目录组织", Duration: "12:06"},
				{ID: "player-wxgame-l2", Title: "第 2 节 资源加载与场景布局", Duration: "11:10"},
			}},
			{ID: "player-wxgame-chapter-2", Title: "模块 2 · 飞机大战示例实战", Lessons: []lessonDef{
				{ID: "player-wxgame-l3", Title: "第 3 节 飞机大战交互循环", Duration: "项目演示"},
				{ID: "player-wxgame-l4", Title: "第 4 节 真机调试与发布", Duration: "09:42"},
			}},
		},
	},
}

func pageEntry(url string, method ...string) gin.H {
	nextMethod := "navigateTo"
	if len(method) > 0 && method[0] != "" {
		nextMethod = method[0]
	}

	return gin.H{"url": url, "method": nextMethod}
}

func toProductDetail(id string) gin.H {
	return pageEntry("/pages/product-detail/product-detail?courseId=" + id)
}

func toCoursePlayer(courseID string, lessonID ...string) gin.H {
	url := "/pages/course-player/course-player?courseId=" + courseID
	if len(lessonID) > 0 && lessonID[0] != "" {
		url += "&lessonId=" + lessonID[0]
	}
	return pageEntry(url)
}

func isSeedCourseRouteID(id string) bool {
	switch strings.TrimSpace(id) {
	case seedProductPublicID, seedPlayerCoursePublicID, strconv.FormatInt(seedSQLiteCourseID, 10):
		return true
	default:
		return false
	}
}

func currentDBUserID(c *gin.Context) (int64, bool) {
	value, exists := c.Get(userContextKey)
	if !exists {
		return seedStudentUserID, true
	}

	session, ok := value.(domain.UserSession)
	if !ok {
		errorJSON(c, http.StatusUnauthorized, 40102, "invalid login session")
		return 0, false
	}

	id, err := strconv.ParseInt(strings.TrimSpace(session.ID), 10, 64)
	if err != nil || id <= 0 {
		errorJSON(c, http.StatusUnauthorized, 40102, "invalid login session")
		return 0, false
	}
	return id, true
}

func loadSeedCourse(c *gin.Context, deps Dependencies) (domain.PlayerCourse, bool) {
	if deps.Courses == nil {
		return domain.PlayerCourse{}, false
	}

	userID, ok := currentDBUserID(c)
	if !ok {
		return domain.PlayerCourse{}, false
	}

	course, err := deps.Courses.GetPlayerCourse(c.Request.Context(), seedSQLiteCourseID, userID)
	if err != nil {
		writeCourseLoadError(c, err)
		return domain.PlayerCourse{}, false
	}
	return course, true
}

func writeCourseLoadError(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		errorJSON(c, http.StatusNotFound, 40404, "course not found")
		return
	}
	errorJSON(c, http.StatusInternalServerError, 50002, "course service unavailable")
}

func seedLessonID(id string) (int64, bool) {
	id = strings.TrimSpace(id)
	if strings.HasPrefix(id, seedLessonPublicPrefix) {
		id = strings.TrimPrefix(id, seedLessonPublicPrefix)
	}

	value, err := strconv.ParseInt(id, 10, 64)
	if err != nil || value <= 0 {
		return 0, false
	}
	return value, true
}

func seedLessonPublicID(id int64) string {
	if id <= 0 {
		return ""
	}
	return seedLessonPublicPrefix + strconv.FormatInt(id, 10)
}

func handleHome(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		purchasedCourses := []gin.H{
			ownedCourse("owned-course-aigc", "AI", "cyan", "录播课", "AIGC 视频制作", seedPlayerCoursePublicID),
			ownedCourse("owned-course-wechat-game", "WX", "indigo", "录播课", "微信小游戏开发", "player-wechat-game"),
			ownedCourse("owned-course-1", "IP", "purple", "系列课", "个人 IP 内容变现实战课", "player-ip-course"),
		}
		if course, ok := loadSeedCourse(c, deps); ok {
			purchasedCourses[0] = ownedCourseFromDomain(course)
		} else if c.Writer.Written() {
			return
		}

		ok(c, gin.H{
			"currentBannerIndex": 0,
			"bannerAutoplay":     true,
			"bannerResumeDelay":  160,
			"bannerList": []gin.H{
				{"id": "banner-1", "src": "/assets/home/banner1.jpg"},
				{"id": "banner-2", "src": "/assets/home/banner2.jpg"},
			},
			"searchEntry":      pageEntry("/pages/product-list/product-list?category=all"),
			"categoriesEntry":  pageEntry("/pages/product-categories/product-categories"),
			"ownedAllEntry":    pageEntry("/pages/learning/learning", "reLaunch"),
			"liveCenterEntry":  pageEntry("/pages/live-list/live-list"),
			"purchasedCourses": purchasedCourses,
			"recommendedCourses": []gin.H{
				{"id": "course-2", "coverTheme": "cover-blue", "tag": "视频课", "title": "短视频表达与节奏训练", "author": "Gerry", "meta": "4 节课程 · 口播拍摄训练", "price": "会员可学", "hint": "口播结构 / 镜头状态 / 节奏感", "entry": toProductDetail("course-2")},
				{"id": "course-3", "coverTheme": "cover-indigo", "tag": "图文课", "title": "朋友圈内容转化模型", "author": "Gerry", "meta": "4 节课程 · 图文成交训练", "price": "¥129", "hint": "内容铺垫 / 信任积累 / 转化动作", "entry": toProductDetail("course-3")},
			},
			"featureCards": []gin.H{
				{"id": "feature-1", "type": "camp", "eyebrow": "训练营推荐", "title": "7 天私域增长训练营", "desc": "每天一个内容动作，当前 Day 2 / 7 聚焦朋友圈内容拆解。", "action": "查看详情", "entry": pageEntry("/pages/bootcamp-detail/bootcamp-detail?campId=camp-7day-growth")},
				{"id": "feature-2", "type": "live", "eyebrow": "直播推荐", "title": "今晚 20:00 私域运营直播答疑", "desc": "90 分钟直播答疑，聚焦内容变现 / 学员转化 / 日常运营问题。", "action": "预约提醒", "entry": pageEntry("/pages/live-detail/live-detail?liveId=1&mode=upcoming")},
				{"id": "feature-3", "type": "member", "eyebrow": "会员推荐", "title": "年度会员计划", "desc": "解锁录播课、训练营精选内容和直播回放权益。", "action": "了解权益", "entry": pageEntry("/pages/member-rights/member-rights?source=home")},
			},
		})
	}
}

func ownedCourse(id string, monogram string, theme string, badge string, title string, playerID string) gin.H {
	state := getProgress(playerID)
	currentTitle := lessonTitle(playerID, state.CurrentLessonID)
	return gin.H{
		"id":                id,
		"badge":             badge,
		"title":             title,
		"meta":              progressText(state),
		"summary":           strings.TrimPrefix(currentTitle, "第 "),
		"recentLessonIndex": "最近学习",
		"action":            "学习",
		"theme":             theme,
		"monogram":          monogram,
		"entry":             toCoursePlayer(playerID),
	}
}

func ownedCourseFromDomain(course domain.PlayerCourse) gin.H {
	currentTitle := domainLessonTitle(course, course.ProgressSummary.CurrentLessonID)
	return gin.H{
		"id":                "owned-course-aigc",
		"badge":             "录播课",
		"title":             course.Title,
		"meta":              domainProgressText(course.ProgressSummary),
		"summary":           strings.TrimPrefix(currentTitle, "第 "),
		"recentLessonIndex": "最近学习",
		"action":            "学习",
		"theme":             "cyan",
		"monogram":          "AI",
		"entry":             toCoursePlayer(seedPlayerCoursePublicID),
	}
}

func productListItemFromDomain(course domain.PlayerCourse) gin.H {
	return productListItem(
		seedProductPublicID,
		"course",
		"录播课",
		course.Title,
		seedCourseMeta(course),
		"已购内容",
		"脚本 / 口播 / 剪辑流程",
		toProductDetail(seedProductPublicID),
	)
}

func courseDetailFromDomain(course domain.PlayerCourse) gin.H {
	return gin.H{
		"id": seedProductPublicID, "playerCourseId": seedPlayerCoursePublicID, "accessType": "purchased", "tag": "录播课", "title": course.Title,
		"author": "Gerry", "coverTheme": "cover-blue", "coverHint": "脚本 / 口播 / 剪辑发布",
		"meta": seedCourseMeta(course), "price": "已购内容", "access": "支持随时回看 · 适合快速上手",
		"description":         course.Description,
		"gains":               []string{"理解内容交付的核心流程", "掌握可复用的实战方法", "建立适合个人 IP 的学习路径"},
		"suitable":            []string{"内容创作者", "教培讲师", "个人 IP 起步者"},
		"progressSummary":     domainProgressSummary(course, "最近学习："),
		"chapters":            renderedDomainChapters(course),
		"note":                "当前 P0 后端接口已返回课程目录、学习进度和播放入口。",
		"primaryEntry":        toCoursePlayer(seedPlayerCoursePublicID),
		"primaryActionText":   "继续学习",
		"secondaryEntry":      pageEntry("/pages/consultation/consultation?scene=course&title=" + course.Title),
		"secondaryActionText": "咨询课程",
		"posterActionText":    "保存海报",
		"posterSavingText":    "保存中",
		"posterMessages":      gin.H{"generatingTitle": "海报生成中", "savingTitle": "正在保存", "successTitle": "海报已保存", "failureTitle": "海报保存失败"},
	}
}

func playerCourseFromDomain(course domain.PlayerCourse) gin.H {
	return gin.H{
		"id": seedPlayerCoursePublicID, "accessType": "purchased", "unlockStrategy": "sequential", "lockedAction": "progress",
		"title": course.Title, "coverUrl": course.CoverURL, "duration": course.Duration, "sourceLabel": course.SourceLabel,
		"videoUrl": course.VideoURL, "resourceState": course.ResourceState,
		"description": course.Description, "outlineText": course.OutlineText,
		"progressSummary":    domainProgressSummary(course, "本节："),
		"chapters":           renderedDomainChapters(course),
		"lockedLessonAction": gin.H{"entry": nil, "feedback": "完成上一节后解锁"},
	}
}

func learningCourseFromDomain(course domain.PlayerCourse) gin.H {
	return gin.H{
		"id":            "learn-aigc",
		"type":          "课程",
		"title":         course.Title,
		"progress":      domainProgressText(course.ProgressSummary),
		"lastLabel":     "最近学习",
		"lastText":      domainLessonTitle(course, course.ProgressSummary.CurrentLessonID),
		"theme":         "cyan",
		"actionLabel":   "继续学习",
		"detailEntry":   toProductDetail(seedProductPublicID),
		"continueEntry": toCoursePlayer(seedPlayerCoursePublicID),
	}
}

func merchantProductItemFromDomain(course domain.PlayerCourse) gin.H {
	item := merchantProductItem("product-course-aigc", "course", "课程", course.Title, "脚本 / 口播 / 剪辑流程", "已上架", "published", "今天 09:40", "cyan")
	item["courseId"] = strconv.FormatInt(course.ID, 10)
	return item
}

func renderedDomainChapters(course domain.PlayerCourse) []gin.H {
	lessons := flatDomainLessons(course)
	currentIndex := 0
	for i, lesson := range lessons {
		if lesson.ID == course.ProgressSummary.CurrentLessonID {
			currentIndex = i
			break
		}
	}

	globalIndex := -1
	chapters := make([]gin.H, 0, len(course.Chapters))
	for _, chapter := range course.Chapters {
		items := make([]gin.H, 0, len(chapter.Lessons))
		for _, lesson := range chapter.Lessons {
			globalIndex++
			status := "locked"
			if lesson.ID == course.ProgressSummary.CurrentLessonID {
				status = "current"
			} else if globalIndex < course.ProgressSummary.CompletedLessons {
				status = "completed"
			} else if globalIndex == course.ProgressSummary.CompletedLessons || globalIndex == currentIndex+1 {
				status = "upcoming"
			}
			publicLessonID := seedLessonPublicID(lesson.ID)
			items = append(items, gin.H{
				"id":            publicLessonID,
				"title":         lesson.Title,
				"duration":      lesson.Duration,
				"status":        status,
				"stateLabel":    lessonStateLabel(status),
				"resourceState": lesson.ResourceState,
				"videoUrl":      lesson.VideoURL,
				"entry":         toCoursePlayer(seedPlayerCoursePublicID, publicLessonID),
			})
		}
		chapters = append(chapters, gin.H{"id": strconv.FormatInt(chapter.ID, 10), "title": chapter.Title, "summary": chapter.Summary, "lessons": items})
	}
	return chapters
}

func progressResponseFromDomain(courseID string, course domain.PlayerCourse, progressSeconds ...int) gin.H {
	lessonID := seedLessonPublicID(course.ProgressSummary.CurrentLessonID)
	seconds := course.ProgressSummary.ProgressSeconds
	if len(progressSeconds) > 0 {
		seconds = progressSeconds[0]
	}
	if seconds < 0 {
		seconds = 0
	}
	return gin.H{
		"course_id":          courseID,
		"lesson_id":          lessonID,
		"completed_lessons":  course.ProgressSummary.CompletedLessons,
		"total_lessons":      domainTotalLessons(course),
		"progress_percent":   course.ProgressSummary.Percent,
		"progress_seconds":   seconds,
		"last_position":      domainLastPosition(course.ProgressSummary),
		"current_lesson_id":  lessonID,
		"current_lesson":     domainLessonTitle(course, course.ProgressSummary.CurrentLessonID),
		"completed_duration": domainCompletedDuration(course.ProgressSummary),
	}
}

func domainProgressSummary(course domain.PlayerCourse, prefix string) gin.H {
	currentTitle := domainLessonTitle(course, course.ProgressSummary.CurrentLessonID)
	return gin.H{
		"status":             "已购课程",
		"completedLessons":   course.ProgressSummary.CompletedLessons,
		"totalLessons":       domainTotalLessons(course),
		"percent":            course.ProgressSummary.Percent,
		"completedDuration":  domainCompletedDuration(course.ProgressSummary),
		"lastPosition":       domainLastPosition(course.ProgressSummary),
		"currentLessonTitle": prefix + currentTitle,
		"nextLessonTitle":    nextDomainLessonTitle(course),
	}
}

func domainProgressText(summary domain.ProgressView) string {
	total := summary.TotalLessons
	if total < 0 {
		total = 0
	}
	return "已学 " + intText(summary.CompletedLessons) + "/" + intText(total) + "节"
}

func seedCourseMeta(course domain.PlayerCourse) string {
	return intText(domainTotalLessons(course)) + " 节课程 · AI 视频入门实践"
}

func domainTotalLessons(course domain.PlayerCourse) int {
	if course.ProgressSummary.TotalLessons > 0 {
		return course.ProgressSummary.TotalLessons
	}
	return len(flatDomainLessons(course))
}

func domainCompletedDuration(summary domain.ProgressView) string {
	return "累计学习 " + intText(summary.CompletedLessons*9) + " 分钟"
}

func domainLastPosition(summary domain.ProgressView) string {
	if strings.TrimSpace(summary.LastPosition) == "" {
		return "暂未开始"
	}
	return summary.LastPosition
}

func domainLessonTitle(course domain.PlayerCourse, lessonID int64) string {
	for _, lesson := range flatDomainLessons(course) {
		if lesson.ID == lessonID {
			return lesson.Title
		}
	}
	return "暂未开始"
}

func nextDomainLessonTitle(course domain.PlayerCourse) string {
	lessons := flatDomainLessons(course)
	for i, lesson := range lessons {
		if lesson.ID == course.ProgressSummary.CurrentLessonID && i+1 < len(lessons) {
			return "下一节：" + lessons[i+1].Title
		}
	}
	return "下一节：继续查看后续课程内容"
}

func flatDomainLessons(course domain.PlayerCourse) []domain.Lesson {
	var lessons []domain.Lesson
	for _, chapter := range course.Chapters {
		lessons = append(lessons, chapter.Lessons...)
	}
	return lessons
}

func handleProductCategories(c *gin.Context) {
	ok(c, []gin.H{
		{"key": "course", "title": "课程", "desc": "录播课 / 图文课 / 系列课", "entry": pageEntry("/pages/product-list/product-list?category=course")},
		{"key": "camp", "title": "训练营", "desc": "打卡任务 / 作业复盘", "entry": pageEntry("/pages/product-list/product-list?category=camp")},
		{"key": "member", "title": "会员", "desc": "权益包 / 回放 / 资料", "entry": pageEntry("/pages/product-list/product-list?category=member")},
	})
}

func handleProducts(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		category := c.DefaultQuery("category", "all")
		products := []gin.H{
			productListItem(seedProductPublicID, "course", "录播课", "AIGC 视频制作", "5 节课程 · AI 视频入门实践", "已购内容", "脚本 / 口播 / 剪辑流程", toProductDetail(seedProductPublicID)),
			productListItem("course-wechat-game", "course", "项目实战", "微信小游戏开发", "4 节课程 · 飞机大战项目实战", "已购内容", "目录组织 / 交互循环 / 真机调试", toProductDetail("course-wechat-game")),
			productListItem("course-1", "course", "系列课", "个人 IP 内容变现实战课", "9 节课程 · 适合 0 到 1 搭建", "¥299", "定位 / 内容结构 / 转化节奏", toProductDetail("course-1")),
			productListItem("camp-7day-growth", "camp", "训练营", "7 天私域增长训练营", "7 天训练 · 每天 1 个任务", "报名中", "打卡 / 公告 / 作业复盘", pageEntry("/pages/bootcamp-detail/bootcamp-detail?campId=camp-7day-growth")),
			productListItem("member-year", "member", "会员", "年度会员计划", "课程权益 / 直播回放 / 内容精选", "会员可学", "课程权益 / 直播回放 / 内容精选", pageEntry("/pages/member-rights/member-rights")),
		}
		if course, ok := loadSeedCourse(c, deps); ok {
			products[0] = productListItemFromDomain(course)
		} else if c.Writer.Written() {
			return
		}

		filtered := make([]gin.H, 0, len(products))
		for _, item := range products {
			if category == "all" || item["type"] == category {
				filtered = append(filtered, item)
			}
		}

		ok(c, gin.H{
			"filterTabs": []gin.H{
				{"key": "all", "label": "全部"},
				{"key": "course", "label": "课程"},
				{"key": "camp", "label": "训练营"},
				{"key": "member", "label": "会员"},
			},
			"activeTab":   category,
			"emptyHint":   "当前先展示课程、训练营和会员的最小商品示例。",
			"productList": filtered,
		})
	}
}

func productListItem(id, itemType, tag, title, subtitle, price, summary string, entry gin.H) gin.H {
	return gin.H{
		"id": id, "type": itemType, "tag": tag, "title": title, "subtitle": subtitle,
		"price": price, "summary": summary, "entry": entry,
	}
}

func handleProductDetail(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("product_id")
		if isSeedCourseRouteID(id) {
			if course, loaded := loadSeedCourse(c, deps); loaded {
				ok(c, courseDetailFromDomain(course))
				return
			} else if c.Writer.Written() {
				return
			}
			ok(c, buildProductDetail(seedProductPublicID))
			return
		}
		ok(c, buildProductDetail(id))
	}
}

func buildProductDetail(id string) gin.H {
	switch id {
	case "course-aigc-video":
		return courseDetail("course-aigc-video", "player-aigc-video", "录播课", "AIGC 视频制作", "5 节课程 · AI 视频入门实践", "已购内容", "支持随时回看 · 适合快速上手")
	case "course-wechat-game":
		return courseDetail("course-wechat-game", "player-wechat-game", "项目实战", "微信小游戏开发", "4 节课程 · 飞机大战项目实战", "已购内容", "支持示例回看 · 适合开发入门")
	case "course-2":
		return previewCourseDetail("course-2", "短视频表达与节奏训练", "会员可学", "member")
	case "course-3":
		return previewCourseDetail("course-3", "朋友圈内容转化模型", "¥129", "consultation")
	default:
		return courseDetail("course-1", "player-ip-course", "系列课", "个人 IP 内容变现实战课", "9 节课程 · 适合 0 到 1 搭建", "¥299", "支持随时回看 · 课程持续更新")
	}
}

func courseDetail(id, playerID, tag, title, meta, price, access string) gin.H {
	def := playerCourses[playerID]
	state := getProgress(playerID)
	return gin.H{
		"id": id, "playerCourseId": playerID, "accessType": "purchased", "tag": tag, "title": title,
		"author": "Gerry", "coverTheme": "cover-blue", "coverHint": "脚本 / 口播 / 剪辑发布",
		"meta": meta, "price": price, "access": access,
		"description":         def.Description,
		"gains":               []string{"理解内容交付的核心流程", "掌握可复用的实战方法", "建立适合个人 IP 的学习路径"},
		"suitable":            []string{"内容创作者", "教培讲师", "个人 IP 起步者"},
		"progressSummary":     progressSummary(playerID, state, "最近学习："),
		"chapters":            renderedChapters(def, state),
		"note":                "当前 P0 后端接口已返回课程目录、学习进度和播放入口。",
		"primaryEntry":        toCoursePlayer(playerID),
		"primaryActionText":   "继续学习",
		"secondaryEntry":      pageEntry("/pages/consultation/consultation?scene=course&title=" + title),
		"secondaryActionText": "咨询课程",
		"posterActionText":    "保存海报",
		"posterSavingText":    "保存中",
		"posterMessages":      gin.H{"generatingTitle": "海报生成中", "savingTitle": "正在保存", "successTitle": "海报已保存", "failureTitle": "海报保存失败"},
	}
}

func previewCourseDetail(id, title, price, action string) gin.H {
	primaryEntry := pageEntry("/pages/member-rights/member-rights?source=course")
	primaryText := "解锁会员"
	if action == "consultation" {
		primaryEntry = toCoursePlayer("player-aigc-video")
		primaryText = "查看试看"
	}
	return gin.H{
		"id": id, "accessType": "preview", "tag": "试看内容", "title": title,
		"author": "Gerry", "coverTheme": "cover-indigo", "coverHint": "内容铺垫 / 信任积累 / 转化动作",
		"meta": "4 节课程 · 试看目录", "price": price, "access": "支持试看 · 完整内容后续开通",
		"description": "当前为试看课程原型，后端已提供基础详情结构。",
		"gains":       []string{"查看课程结构", "理解试看权益", "咨询完整学习路径"},
		"suitable":    []string{"短视频初学者", "私域运营人员"},
		"chapters": []gin.H{{"id": id + "-chapter-1", "title": "模块 1 · 试看内容", "summary": "先看目录和核心结构。", "lessons": []gin.H{
			{"id": id + "-l1", "title": "第 1 节 试看内容", "duration": "08:35", "status": "preview", "stateLabel": "试看", "entry": primaryEntry},
			{"id": id + "-l2", "title": "第 2 节 完整内容", "duration": "10:24", "status": "locked", "stateLabel": "待解锁", "entry": nil, "feedback": "查看会员权益"},
		}}},
		"note":         "当前为 P0 试看数据，购买与支付后续接入。",
		"primaryEntry": primaryEntry, "primaryActionText": primaryText,
		"secondaryEntry": pageEntry("/pages/consultation/consultation?scene=course&title=" + title), "secondaryActionText": "咨询课程",
		"posterActionText": "保存海报", "posterSavingText": "保存中",
	}
}

func handlePlayerCourse(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("course_id")
		if isSeedCourseRouteID(id) {
			if course, loaded := loadSeedCourse(c, deps); loaded {
				ok(c, playerCourseFromDomain(course))
				return
			} else if c.Writer.Written() {
				return
			}
		}

		def, exists := playerCourses[id]
		if !exists {
			errorJSON(c, http.StatusNotFound, 40404, "course not found")
			return
		}

		ok(c, buildPlayerCourse(def))
	}
}

func buildPlayerCourse(def playerCourseDef) gin.H {
	state := getProgress(def.ID)
	return gin.H{
		"id": def.ID, "accessType": def.AccessType, "unlockStrategy": "sequential", "lockedAction": "progress",
		"title": def.Title, "coverUrl": def.CoverURL, "duration": def.Duration, "sourceLabel": def.SourceLabel,
		"videoUrl": def.VideoURL, "resourceState": def.ResourceState,
		"description": def.Description, "outlineText": def.OutlineText,
		"progressSummary":    progressSummary(def.ID, state, "本节："),
		"chapters":           renderedChapters(def, state),
		"lockedLessonAction": gin.H{"entry": nil, "feedback": "完成上一节后解锁"},
	}
}

func handleLearning(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		learningList := []gin.H{
			learningCourse("learn-aigc", "AIGC 视频制作", "cyan", seedPlayerCoursePublicID, seedProductPublicID),
			learningCourse("learn-wechat-game", "微信小游戏开发", "indigo", "player-wechat-game", "course-wechat-game"),
			learningCourse("learn-1", "个人 IP 内容变现实战课", "purple", "player-ip-course", "course-1"),
			{"id": "learn-2", "type": "训练营", "title": "7天增长营", "progress": "Day2/7", "lastLabel": "今日任务", "lastText": "朋友圈拆解", "theme": "blue", "actionLabel": "打卡", "detailEntry": pageEntry("/pages/bootcamp-detail/bootcamp-detail?campId=camp-7day-growth"), "continueEntry": pageEntry("/pages/bootcamp-detail/bootcamp-detail?campId=camp-7day-growth")},
			{"id": "learn-3", "type": "直播回放", "title": "直播答疑回放", "progress": "23:18/90:00", "lastLabel": "重点片段", "lastText": "社群转化节奏", "theme": "indigo", "actionLabel": "回看", "detailEntry": pageEntry("/pages/live-detail/live-detail?liveId=1&mode=replay"), "continueEntry": pageEntry("/pages/live-detail/live-detail?liveId=1&mode=replay")},
		}
		if course, loaded := loadSeedCourse(c, deps); loaded {
			learningList[0] = learningCourseFromDomain(course)
		} else if c.Writer.Written() {
			return
		}

		ok(c, gin.H{
			"metrics":     []gin.H{{"label": "今日学习", "value": "46 分钟"}, {"label": "累计时长", "value": "18.5 小时"}, {"label": "累计天数", "value": "12 天"}},
			"searchEntry": pageEntry("/pages/product-list/product-list?category=all"), "searchFeedback": "通过商品列表查找课程",
			"liveCenterEntry": pageEntry("/pages/live-list/live-list"),
			"learningList":    learningList,
		})
	}
}

func learningCourse(id, title, theme, playerID, detailID string) gin.H {
	state := getProgress(playerID)
	return gin.H{"id": id, "type": "课程", "title": title, "progress": progressText(state), "lastLabel": "最近学习", "lastText": lessonTitle(playerID, state.CurrentLessonID), "theme": theme, "actionLabel": "继续学习", "detailEntry": toProductDetail(detailID), "continueEntry": toCoursePlayer(playerID)}
}

func handleUpdateProgress(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID := c.Param("course_id")
		var req struct {
			LessonID        string `json:"lesson_id"`
			ProgressSeconds int    `json:"progress_seconds"`
			Completed       bool   `json:"completed"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			errorJSON(c, http.StatusBadRequest, 40002, "invalid progress request")
			return
		}

		if isSeedCourseRouteID(courseID) && deps.Progress != nil && deps.Courses != nil {
			lessonID, valid := seedLessonID(req.LessonID)
			if !valid {
				errorJSON(c, http.StatusNotFound, 40404, "course or lesson not found")
				return
			}
			userID, validUser := currentDBUserID(c)
			if !validUser {
				return
			}
			if err := deps.Progress.UpdateProgress(c.Request.Context(), userID, seedSQLiteCourseID, lessonID, req.Completed, req.ProgressSeconds); err != nil {
				writeProgressUpdateError(c, err)
				return
			}
			course, loaded := loadSeedCourse(c, deps)
			if !loaded {
				return
			}
			ok(c, progressResponseFromDomain(courseID, course, req.ProgressSeconds))
			return
		}

		state, updated := updateProgressForUser(progressUserKey(c), courseID, req.LessonID, req.ProgressSeconds, req.Completed)
		if !updated {
			errorJSON(c, http.StatusNotFound, 40404, "course or lesson not found")
			return
		}

		ok(c, progressResponse(courseID, state))
	}
}

func handleCourseProgress(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID := c.Param("course_id")
		if isSeedCourseRouteID(courseID) {
			if course, loaded := loadSeedCourse(c, deps); loaded {
				ok(c, progressResponseFromDomain(courseID, course))
				return
			} else if c.Writer.Written() {
				return
			}
		}

		if _, exists := playerCourses[courseID]; !exists {
			errorJSON(c, http.StatusNotFound, 40404, "course not found")
			return
		}

		ok(c, progressResponse(courseID, getProgressForUser(progressUserKey(c), courseID)))
	}
}

func writeProgressUpdateError(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		errorJSON(c, http.StatusNotFound, 40404, "course or lesson not found")
		return
	}
	errorJSON(c, http.StatusInternalServerError, 50003, "progress service unavailable")
}

func getProgress(courseID string) progressState {
	progressMu.Lock()
	defer progressMu.Unlock()

	return fillProgressDefaults(courseID, progressByCourse[courseID])
}

func getProgressForUser(userKey string, courseID string) progressState {
	progressMu.Lock()
	defer progressMu.Unlock()

	key := userCourseProgressKey(userKey, courseID)
	if state, ok := progressByUserCourse[key]; ok {
		return fillProgressDefaults(courseID, state)
	}

	return fillProgressDefaults(courseID, progressByCourse[courseID])
}

func updateProgress(courseID, lessonID string, progressSeconds int, completed bool) (progressState, bool) {
	def, ok := playerCourses[courseID]
	if !ok {
		return progressState{}, false
	}

	lessons := flatLessons(def)
	index := -1
	for i, lesson := range lessons {
		if lesson.ID == lessonID {
			index = i
			break
		}
	}
	if index < 0 {
		return progressState{}, false
	}

	progressMu.Lock()
	defer progressMu.Unlock()
	state := nextProgressState(fillProgressDefaults(courseID, progressByCourse[courseID]), lessons, index, lessonID, progressSeconds, completed)
	progressByCourse[courseID] = state
	return state, true
}

func updateProgressForUser(userKey string, courseID string, lessonID string, progressSeconds int, completed bool) (progressState, bool) {
	def, ok := playerCourses[courseID]
	if !ok {
		return progressState{}, false
	}

	lessons := flatLessons(def)
	index := -1
	for i, lesson := range lessons {
		if lesson.ID == lessonID {
			index = i
			break
		}
	}
	if index < 0 {
		return progressState{}, false
	}

	progressMu.Lock()
	defer progressMu.Unlock()
	key := userCourseProgressKey(userKey, courseID)
	current, ok := progressByUserCourse[key]
	if !ok {
		current = progressByCourse[courseID]
	}
	state := nextProgressState(fillProgressDefaults(courseID, current), lessons, index, lessonID, progressSeconds, completed)
	progressByUserCourse[key] = state
	return state, true
}

func nextProgressState(current progressState, lessons []lessonDef, lessonIndex int, lessonID string, progressSeconds int, completed bool) progressState {
	completedCount := lessonIndex + 1
	if current.CompletedLessons > completedCount {
		completedCount = current.CompletedLessons
	}
	state := progressState{CompletedLessons: completedCount, TotalLessons: len(lessons), LastSeconds: progressSeconds, CurrentLessonID: lessonID, LastPosition: "上次学到：" + lessons[lessonIndex].Title}
	if !completed {
		state.CompletedLessons = current.CompletedLessons
		state.LastSeconds = progressSeconds
		state.LastPosition = "上次看到 " + formatSeconds(progressSeconds) + " · " + lessons[lessonIndex].Title
	}
	return state
}

func fillProgressDefaults(courseID string, state progressState) progressState {
	if state.TotalLessons == 0 {
		state.TotalLessons = len(flatLessons(playerCourses[courseID]))
	}
	if state.CurrentLessonID == "" {
		lessons := flatLessons(playerCourses[courseID])
		if len(lessons) > 0 {
			state.CurrentLessonID = lessons[0].ID
		}
	}
	return state
}

func progressUserKey(c *gin.Context) string {
	user := currentUser(c)
	if strings.TrimSpace(user.ID) != "" {
		return strings.TrimSpace(user.ID)
	}
	if strings.TrimSpace(user.OpenID) != "" {
		return strings.TrimSpace(user.OpenID)
	}
	return "anonymous"
}

func userCourseProgressKey(userKey string, courseID string) string {
	return strings.TrimSpace(userKey) + "::" + courseID
}

func progressResponse(courseID string, state progressState) gin.H {
	return gin.H{
		"course_id":          courseID,
		"lesson_id":          state.CurrentLessonID,
		"completed_lessons":  state.CompletedLessons,
		"total_lessons":      state.TotalLessons,
		"progress_percent":   progressPercent(state),
		"progress_seconds":   state.LastSeconds,
		"last_position":      state.LastPosition,
		"current_lesson_id":  state.CurrentLessonID,
		"current_lesson":     lessonTitle(courseID, state.CurrentLessonID),
		"completed_duration": "累计学习 " + intText(state.CompletedLessons*9) + " 分钟",
	}
}

func renderedChapters(def playerCourseDef, state progressState) []gin.H {
	lessons := flatLessons(def)
	currentIndex := 0
	for i, item := range lessons {
		if item.ID == state.CurrentLessonID {
			currentIndex = i
			break
		}
	}

	globalIndex := -1
	chapters := make([]gin.H, 0, len(def.Chapters))
	for _, chapter := range def.Chapters {
		items := make([]gin.H, 0, len(chapter.Lessons))
		for _, lesson := range chapter.Lessons {
			globalIndex++
			status := "locked"
			if lesson.ID == state.CurrentLessonID {
				status = "current"
			} else if globalIndex < state.CompletedLessons {
				status = "completed"
			} else if globalIndex == state.CompletedLessons || globalIndex == currentIndex+1 {
				status = "upcoming"
			}
			items = append(items, gin.H{"id": lesson.ID, "title": lesson.Title, "duration": lesson.Duration, "status": status, "stateLabel": lessonStateLabel(status), "entry": toCoursePlayer(def.ID, lesson.ID)})
		}
		chapters = append(chapters, gin.H{"id": chapter.ID, "title": chapter.Title, "summary": chapter.Summary, "lessons": items})
	}
	return chapters
}

func flatLessons(def playerCourseDef) []lessonDef {
	var lessons []lessonDef
	for _, chapter := range def.Chapters {
		lessons = append(lessons, chapter.Lessons...)
	}
	return lessons
}

func progressSummary(courseID string, state progressState, prefix string) gin.H {
	currentTitle := lessonTitle(courseID, state.CurrentLessonID)
	return gin.H{"status": "已购课程", "completedLessons": state.CompletedLessons, "totalLessons": state.TotalLessons, "percent": progressPercent(state), "completedDuration": "累计学习 " + intText(state.CompletedLessons*9) + " 分钟", "lastPosition": state.LastPosition, "currentLessonTitle": prefix + currentTitle, "nextLessonTitle": "下一节：继续查看后续课程内容"}
}

func progressPercent(state progressState) int {
	if state.TotalLessons == 0 {
		return 0
	}
	return int(math.Round(float64(state.CompletedLessons) / float64(state.TotalLessons) * 100))
}

func progressText(state progressState) string {
	return "已学 " + intText(state.CompletedLessons) + "/" + intText(state.TotalLessons) + "节"
}

func lessonTitle(courseID, lessonID string) string {
	for _, lesson := range flatLessons(playerCourses[courseID]) {
		if lesson.ID == lessonID {
			return lesson.Title
		}
	}
	return "暂未开始"
}

func lessonStateLabel(status string) string {
	switch status {
	case "completed":
		return "已完成"
	case "current":
		return "学习中"
	case "preview":
		return "试看"
	case "locked":
		return "待解锁"
	default:
		return "待学习"
	}
}

func intText(value int) string {
	return strconv.Itoa(value)
}

func formatSeconds(seconds int) string {
	if seconds <= 0 {
		return "00:00"
	}

	minutes := seconds / 60
	remainingSeconds := seconds % 60
	return strconv.Itoa(minutes) + ":" + twoDigit(remainingSeconds)
}

func twoDigit(value int) string {
	if value < 10 {
		return "0" + strconv.Itoa(value)
	}

	return strconv.Itoa(value)
}

func handleBootcampDetail(c *gin.Context) {
	ok(c, gin.H{
		"navSubtitle":        "任务节奏与打卡进度",
		"footerTip":          "今日任务已解锁",
		"checkInActionLabel": "去打卡",
		"checkInFeedback":    "打卡功能后续接入",
		"noticeActionLabel":  "查看详情",
		"noticeFeedback":     "公告详情后续接入",
		"bootcamp": gin.H{
			"id": "camp-7day-growth", "title": "7 天私域增长训练营",
			"subtitle": "7 天训练 · 每天 1 个任务", "status": "进行中 · Day 2 / 7",
			"coverTheme": "camp-cover", "coverHint": "内容分发 / 社群互动 / 转化动作",
			"description": "按照每天一个主题动作推进，帮助你在一周内搭建基础的内容经营节奏。",
			"suitable":    []string{"内容型创业者", "教培讲师", "私域初学者", "需要陪跑节奏的人"},
			"support":     []string{"每日任务拆解", "打卡反馈", "训练营公告同步", "示例作业参考"},
			"progress":    gin.H{"completedDays": 2, "totalDays": 7, "streakText": "已连续完成 2 天"},
			"todayFocus":  gin.H{"dayLabel": "Day 2 今日任务", "title": "朋友圈内容拆解与发布", "desc": "完成 1 条朋友圈内容拆解，输出自己的改写版本。", "tasks": []string{"观看示例短课", "完成 1 条朋友圈改写", "提交今日打卡"}},
			"schedule": []gin.H{
				{"day": "Day 1", "title": "个人定位与内容边界", "status": "已完成", "statusTone": "done"},
				{"day": "Day 2", "title": "朋友圈内容拆解与发布", "status": "进行中", "statusTone": "active"},
				{"day": "Day 3", "title": "社群互动与提问设计", "status": "待开始", "statusTone": "pending"},
				{"day": "Day 4", "title": "转化话术与成交提醒", "status": "待开始", "statusTone": "pending"},
			},
			"notices": []string{"今日打卡截止时间为 21:00。", "晚间会同步发布优秀作业参考。"},
		},
	})
}

func handleMemberRights(c *gin.Context) {
	ok(c, gin.H{
		"navSubtitle": "年度会员权益说明", "heroTitle": "年度会员计划",
		"heroDesc":          "当前阶段以课程学习、直播回放和训练营精选内容为主。",
		"primaryActionText": "查看会员内容", "secondaryActionText": "咨询会员",
		"primaryEntry": pageEntry("/pages/product-list/product-list?category=course"), "secondaryEntry": pageEntry("/pages/consultation/consultation?scene=member&title=年度会员计划"),
		"rights":          []gin.H{{"id": "right-1", "title": "录播课权益", "desc": "解锁已开放录播课程"}, {"id": "right-2", "title": "直播回放", "desc": "查看精选直播回放"}},
		"includedContent": []string{"AIGC 视频制作", "微信小游戏开发", "直播答疑回放"},
		"notes":           []string{"购买、续费与权益有效期后续随支付链路接入。", "当前接口用于 P0 页面联调。"},
	})
}

func handleProfile(c *gin.Context) {
	user := currentUser(c)
	ok(c, gin.H{
		"user":             gin.H{"name": user.Nickname, "avatarText": "时", "phone": "未绑定手机号", "tag": "已登录"},
		"memberCard":       gin.H{"title": "年度会员计划", "desc": "课程权益、直播回放和训练营精选内容", "actionTarget": "年度会员计划", "entry": pageEntry("/pages/member-rights/member-rights?source=profile")},
		"merchantEntry":    gin.H{"title": "商家工作台", "desc": "查看商品、直播、用户与内容运营", "actionTarget": "商家工作台", "entry": pageEntry("/pages/merchant-dashboard/merchant-dashboard")},
		"serviceItems":     []gin.H{{"label": "消息通知", "entry": pageEntry("/pages/notifications/notifications")}, {"label": "咨询反馈", "entry": pageEntry("/pages/consultation/consultation")}, {"label": "系统设置", "entry": pageEntry("/pages/settings/settings")}},
		"fallbackFeedback": "功能后续接入",
	})
}

func handleMerchantDashboard(c *gin.Context) {
	ok(c, gin.H{
		"metrics":    []gin.H{{"label": "课程数", "value": "6", "note": "已发布 4 门"}, {"label": "训练营数", "value": "2", "note": "进行中 1 个"}, {"label": "直播场次", "value": "5", "note": "本周 2 场"}, {"label": "学习人数", "value": "328", "note": "近 7 日 +18"}},
		"todos":      []gin.H{{"id": "todo-course", "tag": "待发布", "title": "完善课程说明", "note": "建议补充学习目标", "feedback": "完善课程说明"}},
		"shortcuts":  []gin.H{{"key": "product", "label": "商品管理", "hint": "课程 / 训练营 / 会员", "entry": pageEntry("/pages/product-management/product-management")}, {"key": "live", "label": "直播管理", "hint": "直播配置 / 回放说明", "entry": pageEntry("/pages/live-management/live-management")}, {"key": "user", "label": "用户管理", "hint": "学员 / 标签 / 跟进", "entry": pageEntry("/pages/user-management/user-management")}, {"key": "content", "label": "内容运营", "hint": "Banner / 推荐位 / 公告", "entry": pageEntry("/pages/content-ops/content-ops")}},
		"activities": []gin.H{{"id": "activity-1", "title": "AIGC 视频制作已更新到课程推荐区", "time": "今天 10:20", "note": "首页已展示示例。"}},
	})
}

func handleMerchantProducts(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemType := c.DefaultQuery("type", "all")
		products := []gin.H{
			merchantProductItem("product-course-ip", "course", "课程", "个人 IP 内容变现实战课", "定位 / 内容结构 / 转化节奏", "已上架", "published", "今天 09:40", "purple"),
			merchantProductItem("product-course-aigc", "course", "课程", "AIGC 视频制作", "脚本 / 口播 / 剪辑流程", "已上架", "published", "昨天 21:10", "cyan"),
			merchantProductItem("product-camp-growth", "bootcamp", "训练营", "7 天私域增长训练营", "打卡 / 公告 / 作业复盘", "进行中", "active", "昨天 18:20", "blue"),
			merchantProductItem("product-member-year", "member", "会员", "年度会员计划", "课程权益 / 直播回放 / 内容精选", "草稿", "draft", "05-03 16:30", "gold"),
		}
		if course, loaded := loadSeedCourse(c, deps); loaded {
			products[1] = merchantProductItemFromDomain(course)
		} else if c.Writer.Written() {
			return
		}

		filtered := make([]gin.H, 0, len(products))
		for _, item := range products {
			if itemType == "all" || item["type"] == itemType {
				filtered = append(filtered, item)
			}
		}

		ok(c, gin.H{
			"pageHint":       "当前先展示课程、训练营和会员商品的最小管理示例。",
			"filterTabs":     []gin.H{{"key": "all", "label": "全部"}, {"key": "course", "label": "课程"}, {"key": "bootcamp", "label": "训练营"}, {"key": "member", "label": "会员"}},
			"activeTab":      itemType,
			"createFeedback": "新建商品流程后续接入",
			"productList":    filtered,
		})
	}
}

func handleMerchantCourseEdit(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, valid := merchantCourseID(c)
		if !valid {
			return
		}
		if deps.Courses == nil {
			errorJSON(c, http.StatusInternalServerError, 50002, "course service unavailable")
			return
		}

		payload, err := deps.Courses.GetCourseEdit(c.Request.Context(), courseID)
		if err != nil {
			writeMerchantCourseError(c, err)
			return
		}

		ok(c, payload)
	}
}

func handleMerchantCourseUpdate(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, valid := merchantCourseID(c)
		if !valid {
			return
		}
		if deps.Courses == nil {
			errorJSON(c, http.StatusInternalServerError, 50002, "course service unavailable")
			return
		}

		var payload domain.CourseEditPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			errorJSON(c, http.StatusBadRequest, 40002, "invalid course edit request")
			return
		}
		payload.ID = courseID

		updated, err := deps.Courses.SaveCourseEdit(c.Request.Context(), courseID, payload)
		if err != nil {
			writeMerchantCourseError(c, err)
			return
		}

		ok(c, updated)
	}
}

func handleMerchantCourseAnalytics(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, valid := merchantCourseID(c)
		if !valid {
			return
		}
		if deps.Progress == nil {
			errorJSON(c, http.StatusInternalServerError, 50003, "progress service unavailable")
			return
		}

		analytics, err := deps.Progress.CourseAnalytics(c.Request.Context(), courseID)
		if err != nil {
			writeMerchantAnalyticsError(c, err)
			return
		}

		ok(c, analytics)
	}
}

func merchantCourseID(c *gin.Context) (int64, bool) {
	courseID, err := strconv.ParseInt(c.Param("course_id"), 10, 64)
	if err != nil || courseID <= 0 {
		errorJSON(c, http.StatusBadRequest, 40003, "invalid course id")
		return 0, false
	}
	return courseID, true
}

func writeMerchantCourseError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrCourseValidation):
		errorJSON(c, http.StatusBadRequest, 40004, "invalid course edit request")
	case errors.Is(err, sql.ErrNoRows):
		errorJSON(c, http.StatusNotFound, 40404, "course not found")
	default:
		errorJSON(c, http.StatusInternalServerError, 50002, "course service unavailable")
	}
}

func writeMerchantAnalyticsError(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		errorJSON(c, http.StatusNotFound, 40404, "course not found")
		return
	}
	errorJSON(c, http.StatusInternalServerError, 50003, "progress service unavailable")
}

func merchantProductItem(id, itemType, typeLabel, title, coverHint, status, statusTone, updatedAt, theme string) gin.H {
	return gin.H{
		"id":           id,
		"type":         itemType,
		"typeLabel":    typeLabel,
		"title":        title,
		"coverHint":    coverHint,
		"status":       status,
		"statusTone":   statusTone,
		"updatedAt":    updatedAt,
		"theme":        theme,
		"editFeedback": "编辑 " + title,
	}
}

func handleMerchantUsers(c *gin.Context) {
	ok(c, gin.H{"pageHint": "当前先展示学员分层、活跃状态和学习摘要。", "filterTabs": []gin.H{{"key": "all", "label": "全部"}, {"key": "active", "label": "高活跃"}, {"key": "camp", "label": "训练营成员"}, {"key": "live", "label": "直播参与者"}}, "activeTab": c.DefaultQuery("segment", "all"), "searchFeedback": "搜索能力后续接入", "userList": []gin.H{{"id": "user-1", "name": "时昕同学", "phone": "138 **** 8821", "activeAt": "今天 09:20", "progress": "AIGC 视频制作 · 已学 1/5节", "tags": []string{"课程学员", "高活跃"}, "avatarText": "时", "tapFeedback": "查看 时昕同学"}}})
}

func handleMerchantContentOps(c *gin.Context) {
	ok(c, gin.H{"pageHint": "当前先展示 Banner、推荐位和公告配置。", "banners": []gin.H{{"id": "banner-home-main", "title": "首页主 Banner", "current": "时昕有点懒 · 自媒体学习", "note": "当前绑定 banner1 / banner2 轮播图", "actionFeedback": "编辑 Banner"}}, "recommendationSlots": []gin.H{{"id": "slot-course", "label": "主推课程", "content": "个人 IP 内容变现实战课", "action": "调整内容", "actionFeedback": "调整内容"}}, "notices": []gin.H{{"id": "notice-1", "title": "首页公告文案", "content": "建议保留一条本周重点更新说明。", "actionFeedback": "编辑公告"}}})
}

func handleNotifications(c *gin.Context) {
	ok(c, gin.H{"navSubtitle": "课程、直播与训练营动态", "notificationList": []gin.H{{"id": "notice-course", "type": "课程更新", "title": "AIGC 视频制作更新", "summary": "新增课程播放与学习进度接口。", "time": "今天 10:20"}}, "tips": []string{"当前接口用于 P0 联调。"}})
}

func handleSettings(c *gin.Context) {
	ok(c, gin.H{"heroTitle": "系统设置", "heroDesc": "管理基础提醒和播放设置。", "switches": gin.H{"autoplayBanner": true, "liveReminder": true, "replayReminder": true}, "switchItems": []gin.H{{"key": "autoplayBanner", "title": "首页 Banner 自动轮播", "desc": "控制首页 Banner 是否自动切换。"}, {"key": "liveReminder", "title": "直播开始提醒", "desc": "用于后续开播提醒。"}}})
}

func handleConsultation(c *gin.Context) {
	scene := c.DefaultQuery("scene", "profile")
	title := c.DefaultQuery("title", "通用咨询")
	ok(c, gin.H{"scene": scene, "pageTitle": "咨询反馈", "pageSubtitle": "提交你的问题和反馈", "contextLabel": "咨询目标", "targetTitle": title, "quickQuestions": []string{"适合谁学习", "是否支持回放", "如何进入课程"}, "draftMessage": "", "submitTitle": "已记录", "submitDesc": "后续接入真实客服与消息通知。"})
}
