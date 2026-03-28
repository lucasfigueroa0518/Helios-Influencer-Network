-- ============================================================
-- HIN Database Schema — Execute in dependency order
-- ============================================================

-- 1. profiles (no FK deps beyond auth.users)
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'admin'
                        CHECK (role IN ('admin','manager','creator','viewer')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. accounts (depends on auth.users)
CREATE TABLE public.accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instagram_user_id   TEXT UNIQUE,
    instagram_username  TEXT,
    display_name        TEXT NOT NULL,
    avatar_url          TEXT,
    system_prompt       TEXT NOT NULL DEFAULT '',
    tone_keywords       TEXT[] DEFAULT '{}',
    bio                 TEXT,
    access_token_enc    TEXT,
    token_iv            TEXT,
    token_expires_at    TIMESTAMPTZ,
    token_refresh_at    TIMESTAMPTZ,
    posting_schedule    JSONB NOT NULL DEFAULT '{"times":["09:00","12:00","18:00"],"timezone":"UTC","max_per_day":3}',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    last_api_check      TIMESTAMPTZ,
    api_status          TEXT DEFAULT 'unknown'
                            CHECK (api_status IN ('healthy','degraded','error','unknown')),
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_ig_user ON accounts(instagram_user_id);

-- 3. clients (depends on auth.users)
CREATE TABLE public.clients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    logo_url            TEXT,
    contact_email       TEXT,
    topic_keywords      TEXT[] NOT NULL DEFAULT '{}',
    hashtag_tracking    TEXT[] DEFAULT '{}',
    campaign_name       TEXT,
    campaign_start      DATE,
    campaign_end        DATE,
    campaign_budget     NUMERIC(12,2),
    campaign_goals      JSONB DEFAULT '{}',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    auto_suggested      BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_keywords ON clients USING GIN(topic_keywords);

-- 4. upload_batches (depends on accounts, auth.users)
CREATE TABLE public.upload_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','caption_generation','scheduling','completed','partial_failure','failed')),
    total_files     INT NOT NULL DEFAULT 0,
    processed_files INT NOT NULL DEFAULT 0,
    failed_files    INT NOT NULL DEFAULT 0,
    error_log       JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. posts (depends on accounts, upload_batches, clients, auth.users)
CREATE TABLE public.posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    upload_batch_id     UUID REFERENCES upload_batches(id) ON DELETE SET NULL,
    client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
    assigned_to         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    media_type          TEXT NOT NULL CHECK (media_type IN ('image','video','carousel','reel')),
    media_urls          TEXT[] NOT NULL DEFAULT '{}',
    media_hash          TEXT,
    thumbnail_url       TEXT,
    caption             TEXT NOT NULL DEFAULT '',
    hashtags            TEXT[] DEFAULT '{}',
    detected_topics     TEXT[] DEFAULT '{}',
    alt_text            TEXT,
    location_tag        TEXT,
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','pending_review','approved','scheduled','publishing','published','failed','archived')),
    failure_reason      TEXT,
    retry_count         INT NOT NULL DEFAULT 0,
    instagram_post_id   TEXT,
    instagram_permalink TEXT,
    published_at        TIMESTAMPTZ,
    likes_count         INT DEFAULT 0,
    comments_count      INT DEFAULT 0,
    reach               INT DEFAULT 0,
    impressions         INT DEFAULT 0,
    saves               INT DEFAULT 0,
    shares              INT DEFAULT 0,
    engagement_rate     NUMERIC(5,4) DEFAULT 0,
    scheduled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_account ON posts(account_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_posts_client ON posts(client_id);
CREATE INDEX idx_posts_hash ON posts(media_hash);
CREATE INDEX idx_posts_published ON posts(published_at DESC);

-- 6. comments (depends on posts, accounts, auth.users)
CREATE TABLE public.comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    instagram_comment_id TEXT UNIQUE,
    parent_comment_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_username     TEXT NOT NULL,
    author_ig_id        TEXT,
    body                TEXT NOT NULL,
    sentiment           TEXT CHECK (sentiment IN ('positive','neutral','negative','spam')),
    priority_score      INT DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 100),
    is_business_inquiry BOOLEAN DEFAULT false,
    detected_intent     TEXT,
    ai_response_draft   TEXT,
    response_status     TEXT DEFAULT 'unread'
                            CHECK (response_status IN ('unread','ai_drafted','approved','sent','ignored','spam')),
    responded_by        UUID REFERENCES auth.users(id),
    responded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    synced_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_account ON comments(account_id);
CREATE INDEX idx_comments_status ON comments(response_status);
CREATE INDEX idx_comments_priority ON comments(priority_score DESC);

-- 7. direct_messages (depends on accounts, auth.users)
CREATE TABLE public.direct_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    instagram_thread_id TEXT,
    instagram_msg_id    TEXT UNIQUE,
    sender_username     TEXT NOT NULL,
    sender_ig_id        TEXT,
    direction           TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
    body                TEXT NOT NULL,
    media_url           TEXT,
    sentiment           TEXT CHECK (sentiment IN ('positive','neutral','negative','spam')),
    priority_score      INT DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 100),
    is_business_inquiry BOOLEAN DEFAULT false,
    ai_response_draft   TEXT,
    response_status     TEXT DEFAULT 'unread'
                            CHECK (response_status IN ('unread','ai_drafted','approved','sent','ignored','spam')),
    responded_by        UUID REFERENCES auth.users(id),
    responded_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dms_account ON direct_messages(account_id);
CREATE INDEX idx_dms_thread ON direct_messages(instagram_thread_id);
CREATE INDEX idx_dms_status ON direct_messages(response_status);

-- 8. post_metrics_history (depends on posts)
CREATE TABLE public.post_metrics_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    likes           INT NOT NULL DEFAULT 0,
    comments        INT NOT NULL DEFAULT 0,
    reach           INT NOT NULL DEFAULT 0,
    impressions     INT NOT NULL DEFAULT 0,
    saves           INT NOT NULL DEFAULT 0,
    shares          INT NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(5,4) DEFAULT 0,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_metrics_post ON post_metrics_history(post_id, recorded_at DESC);

-- 9. topic_suggestions (depends on auth.users, clients)
CREATE TABLE public.topic_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic           TEXT NOT NULL,
    frequency       INT NOT NULL DEFAULT 0,
    sample_post_ids UUID[] DEFAULT '{}',
    suggested_keywords TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','dismissed')),
    client_id       UUID REFERENCES clients(id),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);
CREATE INDEX idx_suggestions_user ON topic_suggestions(user_id, status);

-- 10. team_members (depends on auth.users)
CREATE TABLE public.team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'viewer'
                        CHECK (role IN ('admin','manager','creator','viewer')),
    invited_email   TEXT,
    invite_status   TEXT NOT NULL DEFAULT 'pending'
                        CHECK (invite_status IN ('pending','accepted','revoked')),
    permissions     JSONB DEFAULT '{"accounts":[],"can_publish":false,"can_delete":false}',
    invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at     TIMESTAMPTZ,
    UNIQUE(team_owner_id, user_id)
);

-- 11. job_logs (no FK deps)
CREATE TABLE public.job_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name        TEXT NOT NULL,
    job_id          TEXT,
    status          TEXT NOT NULL CHECK (status IN ('started','completed','failed','retrying')),
    payload         JSONB DEFAULT '{}',
    result          JSONB DEFAULT '{}',
    error_message   TEXT,
    duration_ms     INT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_job_logs_name ON job_logs(job_name, started_at DESC);
CREATE INDEX idx_job_logs_status ON job_logs(status) WHERE status = 'failed';

-- 12. api_health_logs (no FK deps)
CREATE TABLE public.api_health_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service         TEXT NOT NULL CHECK (service IN ('instagram','gemini','supabase','redis')),
    endpoint        TEXT,
    status_code     INT,
    response_time_ms INT,
    is_healthy      BOOLEAN NOT NULL DEFAULT true,
    error_message   TEXT,
    checked_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_health_service ON api_health_logs(service, checked_at DESC);

-- 13. user_preferences (depends on auth.users)
CREATE TABLE public.user_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications     BOOLEAN DEFAULT true,
    push_notifications      BOOLEAN DEFAULT true,
    notify_new_comments     BOOLEAN DEFAULT true,
    notify_new_dms          BOOLEAN DEFAULT true,
    notify_post_published   BOOLEAN DEFAULT true,
    notify_post_failed      BOOLEAN DEFAULT true,
    notify_topic_suggestion BOOLEAN DEFAULT true,
    notify_team_activity    BOOLEAN DEFAULT true,
    default_calendar_view   TEXT DEFAULT 'month' CHECK (default_calendar_view IN ('month','week')),
    sidebar_collapsed       BOOLEAN DEFAULT false,
    theme                   TEXT DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
    timezone                TEXT DEFAULT 'UTC',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. hashtag_performance (depends on accounts)
CREATE TABLE public.hashtag_performance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    hashtag         TEXT NOT NULL,
    times_used      INT NOT NULL DEFAULT 0,
    avg_reach       NUMERIC(10,2) DEFAULT 0,
    avg_engagement  NUMERIC(5,4) DEFAULT 0,
    last_used_at    TIMESTAMPTZ,
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(account_id, hashtag)
);
CREATE INDEX idx_hashtag_account ON hashtag_performance(account_id);

-- 15. audience_insights (depends on accounts)
CREATE TABLE public.audience_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    follower_count  INT DEFAULT 0,
    following_count INT DEFAULT 0,
    age_ranges      JSONB DEFAULT '{}',
    gender_split    JSONB DEFAULT '{}',
    top_cities      JSONB DEFAULT '[]',
    top_countries   JSONB DEFAULT '[]',
    active_hours    JSONB DEFAULT '{}',
    active_days     JSONB DEFAULT '{}',
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audience_account ON audience_insights(account_id, recorded_at DESC);

-- 16. scheduled_posts (depends on posts, accounts)
CREATE TABLE public.scheduled_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    priority        INT NOT NULL DEFAULT 0,
    picked_up       BOOLEAN NOT NULL DEFAULT false,
    picked_up_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scheduled_pending ON scheduled_posts(scheduled_at)
    WHERE picked_up = false;

-- 17. engagement_rules (depends on accounts)
CREATE TABLE public.engagement_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    rule_name       TEXT NOT NULL,
    trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('keyword','sentiment','follower_count','is_verified','is_business')),
    trigger_value   TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('auto_draft','flag_priority','notify_team','ignore')),
    response_template TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    priority        INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rules_account ON engagement_rules(account_id, is_active);
