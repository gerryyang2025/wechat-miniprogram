package db

import (
	"context"
	"database/sql"
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
		`INSERT OR IGNORE INTO users (id, openid, nickname, status) VALUES (1, ?, 'Gerry', 'active')`,
		`INSERT OR IGNORE INTO users (id, openid, nickname, status) VALUES (2, ?, '时昕同学', 'active')`,
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
	}

	args := [][]any{
		{options.MerchantOpenID},
		{options.StudentOpenID},
	}

	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for index, stmt := range statements {
		stmtArgs := []any{}
		if index < len(args) {
			stmtArgs = args[index]
		}
		if _, err := tx.ExecContext(ctx, stmt, stmtArgs...); err != nil {
			return err
		}
	}

	return tx.Commit()
}
