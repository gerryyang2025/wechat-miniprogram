PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL,
  unionid TEXT,
  nickname TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);

CREATE TABLE merchants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  service_contact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_status ON merchants(status);

CREATE TABLE merchant_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_merchant_users_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  CONSTRAINT fk_merchant_users_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uk_merchant_users_user_role ON merchant_users(merchant_id, user_id, role_key);
CREATE INDEX idx_merchant_users_user ON merchant_users(user_id);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL,
  product_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE INDEX idx_products_merchant_status ON products(merchant_id, status);
CREATE INDEX idx_products_type_status ON products(product_type, status);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  merchant_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  access_type TEXT NOT NULL DEFAULT 'purchased',
  unlock_strategy TEXT NOT NULL DEFAULT 'sequential',
  validity_days INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_courses_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE UNIQUE INDEX uk_courses_product ON courses(product_id);
CREATE INDEX idx_courses_merchant_status ON courses(merchant_id, status);

CREATE TABLE course_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_chapters_course FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE INDEX idx_course_chapters_course_sort ON course_chapters(course_id, sort_order);

CREATE TABLE course_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'video',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_preview INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_course_lessons_chapter FOREIGN KEY (chapter_id) REFERENCES course_chapters(id)
);

CREATE INDEX idx_course_lessons_course_sort ON course_lessons(course_id, sort_order);
CREATE INDEX idx_course_lessons_chapter_sort ON course_lessons(chapter_id, sort_order);

CREATE TABLE media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL,
  course_id INTEGER,
  lesson_id INTEGER,
  media_type TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'sftp',
  object_key TEXT NOT NULL,
  play_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL DEFAULT 'recorded_course',
  status TEXT NOT NULL DEFAULT 'uploading',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_assets_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  CONSTRAINT fk_media_assets_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_media_assets_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id)
);

CREATE INDEX idx_media_assets_merchant_status ON media_assets(merchant_id, status);
CREATE INDEX idx_media_assets_course_lesson ON media_assets(course_id, lesson_id);

CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  lesson_id INTEGER,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  last_position TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'learning',
  last_learned_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_progress_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_learning_progress_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_learning_progress_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id)
);

CREATE UNIQUE INDEX uk_learning_progress_user_course ON learning_progress(user_id, course_id);
CREATE INDEX idx_learning_progress_course_status ON learning_progress(course_id, status);

CREATE TABLE bootcamps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  merchant_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  total_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bootcamps_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_bootcamps_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE UNIQUE INDEX uk_bootcamps_product ON bootcamps(product_id);
CREATE INDEX idx_bootcamps_merchant_status ON bootcamps(merchant_id, status);

CREATE TABLE bootcamp_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bootcamp_id INTEGER NOT NULL,
  day_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bootcamp_tasks_bootcamp FOREIGN KEY (bootcamp_id) REFERENCES bootcamps(id)
);

CREATE UNIQUE INDEX uk_bootcamp_tasks_day ON bootcamp_tasks(bootcamp_id, day_index);

CREATE TABLE live_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  speaker TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  start_at TEXT,
  end_at TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  status_override TEXT NOT NULL DEFAULT '',
  live_url TEXT NOT NULL DEFAULT '',
  replay_url TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'all',
  visibility_ref_id INTEGER,
  replay_enabled INTEGER NOT NULL DEFAULT 0,
  replay_media_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_events_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  CONSTRAINT fk_live_events_replay_media FOREIGN KEY (replay_media_id) REFERENCES media_assets(id)
);

CREATE INDEX idx_live_events_merchant_status ON live_events(merchant_id, status);
CREATE INDEX idx_live_events_start_at ON live_events(start_at);
CREATE INDEX idx_live_events_visibility ON live_events(visibility, visibility_ref_id);
CREATE INDEX idx_live_events_status_override ON live_events(status_override);

CREATE TABLE live_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  live_event_id INTEGER NOT NULL,
  rule_type TEXT NOT NULL,
  ref_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_access_rules_event FOREIGN KEY (live_event_id) REFERENCES live_events(id)
);

CREATE INDEX idx_live_access_rules_event_status ON live_access_rules(live_event_id, status);
CREATE INDEX idx_live_access_rules_rule_ref ON live_access_rules(rule_type, ref_id);

CREATE TABLE content_access_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_type TEXT NOT NULL,
  access_ref_id INTEGER NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'seed',
  source_id TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_access_grants_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uk_content_access_grants_unique
  ON content_access_grants(user_id, access_type, access_ref_id, source_type, source_id);
CREATE INDEX idx_content_access_grants_lookup
  ON content_access_grants(user_id, access_type, access_ref_id, status);
CREATE INDEX idx_content_access_grants_source
  ON content_access_grants(source_type, source_id);

CREATE TABLE operation_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER NOT NULL,
  slot_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content_ref_type TEXT NOT NULL DEFAULT '',
  content_ref_id INTEGER,
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_operation_slots_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE UNIQUE INDEX uk_operation_slots_key_order ON operation_slots(merchant_id, slot_key, sort_order);
CREATE INDEX idx_operation_slots_status ON operation_slots(merchant_id, status);
