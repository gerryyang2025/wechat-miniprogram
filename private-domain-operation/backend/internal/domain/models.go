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
