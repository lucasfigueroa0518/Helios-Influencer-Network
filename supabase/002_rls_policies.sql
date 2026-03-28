-- ============================================================
-- RLS Policies for all tables
-- ============================================================

-- Helper: check team membership
-- Used in policies below to grant team members access

-- ── profiles ──────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own" ON profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "profiles_team_read" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = auth.uid()
            AND tm.team_owner_id = profiles.id
            AND tm.invite_status = 'accepted'
        )
    );

-- ── accounts ──────────────────────────────────────────
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_owner" ON accounts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "accounts_team_read" ON accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_owner_id = accounts.user_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

CREATE POLICY "accounts_team_write" ON accounts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_owner_id = accounts.user_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
            AND tm.role IN ('admin','manager')
        )
    );

-- ── clients ───────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_owner" ON clients
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "clients_team_read" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_owner_id = clients.user_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

CREATE POLICY "clients_team_write" ON clients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_owner_id = clients.user_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
            AND tm.role IN ('admin','manager')
        )
    );

-- ── upload_batches ────────────────────────────────────
ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upload_batches_owner" ON upload_batches
    FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "upload_batches_team_read" ON upload_batches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = upload_batches.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

-- ── posts ─────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_owner" ON posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = posts.account_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "posts_team_read" ON posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = posts.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

CREATE POLICY "posts_team_write" ON posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = posts.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
            AND tm.role IN ('admin','manager','creator')
        )
    );

-- ── comments ──────────────────────────────────────────
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_owner" ON comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = comments.account_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "comments_team_read" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = comments.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

-- ── direct_messages ───────────────────────────────────
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dms_owner" ON direct_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = direct_messages.account_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "dms_team_read" ON direct_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = direct_messages.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

-- ── post_metrics_history ──────────────────────────────
ALTER TABLE public.post_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics_owner" ON post_metrics_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM posts p
            JOIN accounts a ON a.id = p.account_id
            WHERE p.id = post_metrics_history.post_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "metrics_team_read" ON post_metrics_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts p
            JOIN accounts a ON a.id = p.account_id
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE p.id = post_metrics_history.post_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

-- ── topic_suggestions ─────────────────────────────────
ALTER TABLE public.topic_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestions_owner" ON topic_suggestions
    FOR ALL USING (user_id = auth.uid());

-- ── team_members ──────────────────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_owner" ON team_members
    FOR ALL USING (team_owner_id = auth.uid());

CREATE POLICY "team_member_self" ON team_members
    FOR SELECT USING (user_id = auth.uid());

-- ── job_logs ──────────────────────────────────────────
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_logs_admin" ON job_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- ── api_health_logs ───────────────────────────────────
ALTER TABLE public.api_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_health_admin" ON api_health_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- ── user_preferences ──────────────────────────────────
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_owner" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- ── hashtag_performance ───────────────────────────────
ALTER TABLE public.hashtag_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hashtag_owner" ON hashtag_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = hashtag_performance.account_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "hashtag_team_read" ON hashtag_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = hashtag_performance.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

-- ── audience_insights ─────────────────────────────────
ALTER TABLE public.audience_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audience_owner" ON audience_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = audience_insights.account_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "audience_team_read" ON audience_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = audience_insights.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );

-- ── scheduled_posts ───────────────────────────────────
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_owner" ON scheduled_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = scheduled_posts.account_id
            AND a.user_id = auth.uid()
        )
    );

-- ── engagement_rules ──────────────────────────────────
ALTER TABLE public.engagement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rules_owner" ON engagement_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accounts a
            WHERE a.id = engagement_rules.account_id
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "rules_team_read" ON engagement_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN team_members tm ON tm.team_owner_id = a.user_id
            WHERE a.id = engagement_rules.account_id
            AND tm.user_id = auth.uid()
            AND tm.invite_status = 'accepted'
        )
    );
