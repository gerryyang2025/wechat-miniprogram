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
