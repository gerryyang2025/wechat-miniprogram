package db

import (
	"context"
	"database/sql"
	"fmt"
)

type SeedOptions struct {
	MerchantOpenID string
	StudentOpenID  string
}

func SeedMinimal(ctx context.Context, conn *sql.DB, options SeedOptions) error {
	if options.MerchantOpenID == "" {
		options.MerchantOpenID = "mock-openid-merchant"
	}
	if options.StudentOpenID == "" {
		options.StudentOpenID = "mock-openid-user"
	}

	statements := []string{
		`INSERT OR IGNORE INTO merchants (id, name, intro, status) VALUES (1, '时昕有点懒', '个人 IP 与私域运营课程', 'active')`,
		`INSERT OR IGNORE INTO merchant_users (id, merchant_id, user_id, role_key, status) VALUES (1, 1, 1, 'owner', 'active')`,
		`INSERT OR IGNORE INTO products (id, merchant_id, product_type, title, subtitle, cover_url, price_cents, status) VALUES (1, 1, 'course', 'AIGC 视频制作', '3 节课程 · AI 视频入门实践', 'https://media.example.com/covers/aigc/lesson-001.jpg', 0, 'published')`,
		`INSERT OR IGNORE INTO courses (id, product_id, merchant_id, title, description, access_type, unlock_strategy, status) VALUES (1, 1, 1, 'AIGC 视频制作', '从脚本构思、口播表达，到成片剪辑与发布节奏。', 'purchased', 'sequential', 'published')`,
		`INSERT OR IGNORE INTO course_chapters (id, course_id, title, summary, sort_order) VALUES (1, 1, '模块 1 · 从选题到脚本', '先完成课程播放最小闭环。', 1)`,
		`INSERT OR IGNORE INTO course_lessons (id, course_id, chapter_id, title, lesson_type, duration_seconds, is_preview, sort_order, status) VALUES (1, 1, 1, '第 1 节 AIGC 视频选题方向', 'video', 564, 0, 1, 'published')`,
		`INSERT OR IGNORE INTO course_lessons (id, course_id, chapter_id, title, lesson_type, duration_seconds, is_preview, sort_order, status) VALUES (2, 1, 1, '第 2 节 AIGC 视频脚本拆解', 'video', 202, 0, 2, 'published')`,
		`INSERT OR IGNORE INTO course_lessons (id, course_id, chapter_id, title, lesson_type, duration_seconds, is_preview, sort_order, status) VALUES (3, 1, 1, '第 3 节 口播结构与节奏', 'video', 491, 0, 3, 'published')`,
		`INSERT OR IGNORE INTO media_assets (id, merchant_id, course_id, lesson_id, media_type, storage_provider, object_key, play_url, cover_url, duration_seconds, file_size, source_type, status) VALUES (1, 1, 1, 1, 'video', 'sftp', 'courses/aigc/lesson-001.mp4', 'https://media.example.com/courses/aigc/lesson-001.mp4', 'https://media.example.com/covers/aigc/lesson-001.jpg', 564, 0, 'recorded_course', 'ready')`,
		`INSERT OR IGNORE INTO media_assets (id, merchant_id, course_id, lesson_id, media_type, storage_provider, object_key, play_url, cover_url, duration_seconds, file_size, source_type, status) VALUES (2, 1, 1, 2, 'video', 'sftp', 'courses/aigc/lesson-002.mp4', 'https://media.example.com/courses/aigc/lesson-002.mp4', 'https://media.example.com/covers/aigc/lesson-001.jpg', 202, 0, 'recorded_course', 'ready')`,
		`INSERT OR IGNORE INTO media_assets (id, merchant_id, course_id, lesson_id, media_type, storage_provider, object_key, play_url, cover_url, duration_seconds, file_size, source_type, status) VALUES (3, 1, 1, 3, 'video', 'sftp', 'courses/aigc/lesson-003.mp4', '', 'https://media.example.com/covers/aigc/lesson-001.jpg', 491, 0, 'recorded_course', 'uploading')`,
		`INSERT OR IGNORE INTO learning_progress (id, user_id, course_id, lesson_id, completed_lessons, total_lessons, progress_percent, progress_seconds, last_position, status, last_learned_at) VALUES (1, 2, 1, 1, 0, 3, 0, 0, '暂未开始', 'learning', CURRENT_TIMESTAMP)`,
		`INSERT OR IGNORE INTO operation_slots (id, merchant_id, slot_key, title, content_ref_type, content_ref_id, image_url, sort_order, status) VALUES (1, 1, 'home_recommended_course', '首页主推课程', 'course', 1, 'https://media.example.com/covers/aigc/lesson-001.jpg', 1, 'active')`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (1, 1, '私域运营直播答疑', '围绕内容变现、训练营承接和直播后复盘动作。', 'Gerry', 'https://media.example.com/covers/live/private-domain-qa.jpg', '2026-06-25T20:00:00+08:00', '2026-06-25T21:30:00+08:00', 'upcoming', '', 'https://media.example.com/live/private-domain-qa.m3u8', 'https://media.example.com/replay/private-domain-qa.mp4', 'course', 1, 1)`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (2, 1, '内容门诊室：短视频表达即时答疑', '聚焦短视频表达与镜头状态的即时答疑。', 'Gerry', 'https://media.example.com/covers/live/content-clinic.jpg', '2026-06-25T19:30:00+08:00', '2026-06-25T20:30:00+08:00', 'live', 'live', 'https://media.example.com/live/content-clinic.m3u8', '', 'member', 1, 0)`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (3, 1, '7 天训练营复盘直播回放', '针对训练营作业和打卡内容集中复盘。', 'Gerry', 'https://media.example.com/covers/live/bootcamp-review.jpg', '2026-06-20T20:00:00+08:00', '2026-06-20T20:45:00+08:00', 'ended', 'replay', 'https://media.example.com/live/bootcamp-review.m3u8', 'https://media.example.com/replay/bootcamp-review.mp4', 'bootcamp', 1, 1)`,
		`INSERT OR IGNORE INTO live_events (id, merchant_id, title, summary, speaker, cover_url, start_at, end_at, status, status_override, live_url, replay_url, visibility, visibility_ref_id, replay_enabled)
		 VALUES (4, 1, '公开体验直播：知识产品起步', '面向全部登录用户的体验直播。', 'Gerry', 'https://media.example.com/covers/live/open-session.jpg', '2026-06-26T20:00:00+08:00', '2026-06-26T21:00:00+08:00', 'upcoming', '', 'https://media.example.com/live/open-session.m3u8', '', 'all', NULL, 0)`,
		`INSERT OR IGNORE INTO content_access_grants (id, user_id, access_type, access_ref_id, source_type, source_id, status)
		 VALUES (1, 2, 'course', 1, 'seed', 'course-1', 'active')`,
		`INSERT OR IGNORE INTO content_access_grants (id, user_id, access_type, access_ref_id, source_type, source_id, status)
		 VALUES (2, 2, 'bootcamp', 1, 'seed', 'bootcamp-1', 'active')`,
		`INSERT OR IGNORE INTO content_access_grants (id, user_id, access_type, access_ref_id, source_type, source_id, status)
		 VALUES (3, 2, 'member', 1, 'seed', 'member-1', 'active')`,
	}

	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := seedUser(ctx, tx, 1, options.MerchantOpenID, "Gerry", "active"); err != nil {
		return err
	}
	if err := seedUser(ctx, tx, 2, options.StudentOpenID, "时昕同学", "active"); err != nil {
		return err
	}

	for _, stmt := range statements {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func seedUser(ctx context.Context, tx *sql.Tx, id int, openid string, nickname string, status string) error {
	var existingID int
	err := tx.QueryRowContext(ctx, "SELECT id FROM users WHERE openid = ? AND id <> ?", openid, id).Scan(&existingID)
	if err == nil {
		return fmt.Errorf("seed user %d openid %q already belongs to user %d", id, openid, existingID)
	}
	if err != sql.ErrNoRows {
		return err
	}

	if _, err := tx.ExecContext(ctx, "INSERT OR IGNORE INTO users (id, openid, nickname, status) VALUES (?, ?, ?, ?)", id, openid, nickname, status); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "UPDATE users SET openid = ? WHERE id = ?", openid, id); err != nil {
		return err
	}

	return nil
}
