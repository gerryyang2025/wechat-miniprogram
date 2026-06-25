package domain

type UserSession struct {
	ID       string   `json:"id"`
	OpenID   string   `json:"openid"`
	Nickname string   `json:"nickname"`
	Avatar   string   `json:"avatar_url"`
	Phone    string   `json:"phone"`
	Roles    []string `json:"roles"`
}

type LoginResult struct {
	Token string      `json:"token"`
	User  UserSession `json:"user"`
}

type CourseSummary struct {
	ID        int64  `json:"id"`
	ProductID int64  `json:"product_id"`
	Title     string `json:"title"`
	Subtitle  string `json:"subtitle"`
	CoverURL  string `json:"coverUrl"`
	Status    string `json:"status"`
}

type Lesson struct {
	ID              int64  `json:"id"`
	Title           string `json:"title"`
	DurationSeconds int    `json:"duration_seconds"`
	Duration        string `json:"duration"`
	Status          string `json:"status"`
	StateLabel      string `json:"stateLabel"`
	VideoURL        string `json:"videoUrl"`
	CoverURL        string `json:"coverUrl"`
	ResourceState   string `json:"resourceState"`
}

type Chapter struct {
	ID      int64    `json:"id"`
	Title   string   `json:"title"`
	Summary string   `json:"summary"`
	Lessons []Lesson `json:"lessons"`
}

type PlayerCourse struct {
	ID              int64        `json:"id"`
	PlayerCourseID  string       `json:"playerCourseId"`
	Title           string       `json:"title"`
	Description     string       `json:"description"`
	CoverURL        string       `json:"coverUrl"`
	VideoURL        string       `json:"videoUrl"`
	ResourceState   string       `json:"resourceState"`
	Duration        string       `json:"duration"`
	SourceLabel     string       `json:"sourceLabel"`
	OutlineText     string       `json:"outlineText"`
	ProgressSummary ProgressView `json:"progressSummary"`
	Chapters        []Chapter    `json:"chapters"`
}

type ProgressView struct {
	CompletedLessons int    `json:"completedLessons"`
	TotalLessons     int    `json:"totalLessons"`
	Percent          int    `json:"percent"`
	ProgressSeconds  int    `json:"progressSeconds"`
	LastPosition     string `json:"lastPosition"`
	CurrentLessonID  int64  `json:"currentLessonId"`
}

type CourseEditPayload struct {
	ID          int64              `json:"id"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Status      string             `json:"status"`
	CoverURL    string             `json:"coverUrl"`
	Lessons     []CourseEditLesson `json:"lessons"`
}

type CourseEditLesson struct {
	ID              int64  `json:"id"`
	Title           string `json:"title"`
	VideoURL        string `json:"videoUrl"`
	CoverURL        string `json:"coverUrl"`
	DurationSeconds int    `json:"durationSeconds"`
}

type CourseAnalytics struct {
	LearnerCount    int    `json:"learnerCount"`
	CompletedCount  int    `json:"completedCount"`
	AverageProgress int    `json:"averageProgress"`
	LatestLearnedAt string `json:"latestLearnedAt"`
}

type LiveListFilter struct {
	Status string
}

type LiveEvent struct {
	ID              int64  `json:"numericId"`
	PublicID        string `json:"id"`
	MerchantID      int64  `json:"merchantId"`
	Title           string `json:"title"`
	Summary         string `json:"summary"`
	Speaker         string `json:"speaker"`
	CoverURL        string `json:"coverUrl"`
	CoverHint       string `json:"coverHint"`
	StartAt         string `json:"startAt"`
	EndAt           string `json:"endAt"`
	Schedule        string `json:"schedule"`
	Duration        string `json:"duration"`
	Status          string `json:"status"`
	StatusOverride  string `json:"statusOverride"`
	EffectiveStatus string `json:"effectiveStatus"`
	StatusLabel     string `json:"statusLabel"`
	LiveURL         string `json:"-"`
	ReplayURL       string `json:"-"`
	Visibility      string `json:"visibility"`
	VisibilityRefID int64  `json:"visibilityRefId"`
	Audience        string `json:"audience"`
	ReplayEnabled   bool   `json:"replayEnabled"`
	ActionText      string `json:"actionText"`
	Theme           string `json:"theme"`
	Entry           any    `json:"entry,omitempty"`
	UpdatedAt       string `json:"updatedAt"`
}

type LiveDetail struct {
	LiveEvent
	Intro          string             `json:"intro"`
	Viewers        string             `json:"viewers"`
	AccessRules    []string           `json:"accessRules"`
	Highlights     []string           `json:"highlights"`
	ReplaySupport  []string           `json:"replaySupport"`
	ReplayMoments  []LiveReplayMoment `json:"replayMoments"`
	TeacherBio     string             `json:"teacherBio"`
	RequiredAccess LiveRequiredAccess `json:"requiredAccess"`
}

type LiveReplayMoment struct {
	Range string `json:"range"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

type LiveRequiredAccess struct {
	Type  string `json:"type"`
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Entry any    `json:"entry,omitempty"`
}

type LiveEditPayload struct {
	ID              int64  `json:"id"`
	Title           string `json:"title"`
	Summary         string `json:"summary"`
	Speaker         string `json:"speaker"`
	CoverURL        string `json:"coverUrl"`
	StartAt         string `json:"startAt"`
	EndAt           string `json:"endAt"`
	StatusOverride  string `json:"statusOverride"`
	LiveURL         string `json:"liveUrl"`
	ReplayURL       string `json:"replayUrl"`
	Visibility      string `json:"visibility"`
	VisibilityRefID int64  `json:"visibilityRefId"`
	ReplayEnabled   bool   `json:"replayEnabled"`
}

type LiveAccessOption struct {
	Type  string `json:"type"`
	ID    int64  `json:"id"`
	Title string `json:"title"`
}

type LiveAccessOptions struct {
	Courses   []LiveAccessOption `json:"courses"`
	Bootcamps []LiveAccessOption `json:"bootcamps"`
	Members   []LiveAccessOption `json:"members"`
}

type LiveAccessDecision struct {
	Allowed        bool               `json:"allowed"`
	Mode           string             `json:"mode,omitempty"`
	TargetURL      string             `json:"targetUrl,omitempty"`
	OpenMethod     string             `json:"openMethod,omitempty"`
	FallbackAction string             `json:"fallbackAction,omitempty"`
	Reason         string             `json:"reason,omitempty"`
	RequiredAccess LiveRequiredAccess `json:"requiredAccess,omitempty"`
}
