export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: 'admin' | 'manager' | 'creator' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: 'admin' | 'manager' | 'creator' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'manager' | 'creator' | 'viewer';
          updated_at?: string;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          instagram_user_id: string | null;
          instagram_username: string | null;
          display_name: string;
          avatar_url: string | null;
          system_prompt: string;
          tone_keywords: string[];
          bio: string | null;
          access_token_enc: string | null;
          token_iv: string | null;
          token_expires_at: string | null;
          token_refresh_at: string | null;
          posting_schedule: Json;
          is_active: boolean;
          last_api_check: string | null;
          api_status: 'healthy' | 'degraded' | 'error' | 'unknown';
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instagram_user_id?: string | null;
          instagram_username?: string | null;
          display_name: string;
          avatar_url?: string | null;
          system_prompt?: string;
          tone_keywords?: string[];
          bio?: string | null;
          access_token_enc?: string | null;
          token_iv?: string | null;
          token_expires_at?: string | null;
          token_refresh_at?: string | null;
          posting_schedule?: Json;
          is_active?: boolean;
          last_api_check?: string | null;
          api_status?: 'healthy' | 'degraded' | 'error' | 'unknown';
          error_message?: string | null;
        };
        Update: {
          user_id?: string;
          instagram_user_id?: string | null;
          instagram_username?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          system_prompt?: string;
          tone_keywords?: string[];
          bio?: string | null;
          access_token_enc?: string | null;
          token_iv?: string | null;
          token_expires_at?: string | null;
          token_refresh_at?: string | null;
          posting_schedule?: Json;
          is_active?: boolean;
          api_status?: 'healthy' | 'degraded' | 'error' | 'unknown';
          error_message?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          account_id: string;
          upload_batch_id: string | null;
          client_id: string | null;
          assigned_to: string | null;
          media_type: 'image' | 'video' | 'carousel' | 'reel';
          media_urls: string[];
          media_hash: string | null;
          thumbnail_url: string | null;
          caption: string;
          hashtags: string[];
          detected_topics: string[];
          alt_text: string | null;
          location_tag: string | null;
          status: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
          failure_reason: string | null;
          retry_count: number;
          instagram_post_id: string | null;
          instagram_permalink: string | null;
          published_at: string | null;
          likes_count: number;
          comments_count: number;
          reach: number;
          impressions: number;
          saves: number;
          shares: number;
          engagement_rate: number;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          upload_batch_id?: string | null;
          client_id?: string | null;
          assigned_to?: string | null;
          media_type: 'image' | 'video' | 'carousel' | 'reel';
          media_urls?: string[];
          media_hash?: string | null;
          thumbnail_url?: string | null;
          caption?: string;
          hashtags?: string[];
          detected_topics?: string[];
          alt_text?: string | null;
          location_tag?: string | null;
          status?: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
          failure_reason?: string | null;
          retry_count?: number;
          instagram_post_id?: string | null;
          instagram_permalink?: string | null;
          published_at?: string | null;
          likes_count?: number;
          comments_count?: number;
          reach?: number;
          impressions?: number;
          saves?: number;
          shares?: number;
          engagement_rate?: number;
          scheduled_at?: string | null;
        };
        Update: {
          account_id?: string;
          upload_batch_id?: string | null;
          client_id?: string | null;
          assigned_to?: string | null;
          media_type?: 'image' | 'video' | 'carousel' | 'reel';
          media_urls?: string[];
          media_hash?: string | null;
          thumbnail_url?: string | null;
          caption?: string;
          hashtags?: string[];
          detected_topics?: string[];
          alt_text?: string | null;
          location_tag?: string | null;
          status?: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
          failure_reason?: string | null;
          retry_count?: number;
          instagram_post_id?: string | null;
          instagram_permalink?: string | null;
          published_at?: string | null;
          likes_count?: number;
          comments_count?: number;
          reach?: number;
          impressions?: number;
          saves?: number;
          shares?: number;
          engagement_rate?: number;
          scheduled_at?: string | null;
        };
        Relationships: [];
      };
      upload_batches: {
        Row: {
          id: string;
          account_id: string;
          uploaded_by: string;
          status: 'pending' | 'processing' | 'caption_generation' | 'scheduling' | 'completed' | 'partial_failure' | 'failed';
          total_files: number;
          processed_files: number;
          failed_files: number;
          error_log: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          uploaded_by: string;
          status?: 'pending' | 'processing' | 'caption_generation' | 'scheduling' | 'completed' | 'partial_failure' | 'failed';
          total_files?: number;
          processed_files?: number;
          failed_files?: number;
          error_log?: Json;
        };
        Update: {
          status?: 'pending' | 'processing' | 'caption_generation' | 'scheduling' | 'completed' | 'partial_failure' | 'failed';
          total_files?: number;
          processed_files?: number;
          failed_files?: number;
          error_log?: Json;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          logo_url: string | null;
          contact_email: string | null;
          topic_keywords: string[];
          hashtag_tracking: string[];
          campaign_name: string | null;
          campaign_start: string | null;
          campaign_end: string | null;
          campaign_budget: number | null;
          campaign_goals: Json;
          is_active: boolean;
          auto_suggested: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          logo_url?: string | null;
          contact_email?: string | null;
          topic_keywords?: string[];
          hashtag_tracking?: string[];
          campaign_name?: string | null;
          campaign_start?: string | null;
          campaign_end?: string | null;
          campaign_budget?: number | null;
          campaign_goals?: Json;
          is_active?: boolean;
          auto_suggested?: boolean;
        };
        Update: {
          name?: string;
          logo_url?: string | null;
          contact_email?: string | null;
          topic_keywords?: string[];
          hashtag_tracking?: string[];
          campaign_name?: string | null;
          campaign_start?: string | null;
          campaign_end?: string | null;
          campaign_budget?: number | null;
          campaign_goals?: Json;
          is_active?: boolean;
          auto_suggested?: boolean;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          account_id: string;
          instagram_comment_id: string | null;
          parent_comment_id: string | null;
          author_username: string;
          author_ig_id: string | null;
          body: string;
          sentiment: 'positive' | 'neutral' | 'negative' | 'spam' | null;
          priority_score: number;
          is_business_inquiry: boolean;
          detected_intent: string | null;
          ai_response_draft: string | null;
          response_status: 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam';
          responded_by: string | null;
          responded_at: string | null;
          created_at: string;
          synced_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          account_id: string;
          instagram_comment_id?: string | null;
          parent_comment_id?: string | null;
          author_username: string;
          author_ig_id?: string | null;
          body: string;
          sentiment?: 'positive' | 'neutral' | 'negative' | 'spam' | null;
          priority_score?: number;
          is_business_inquiry?: boolean;
          detected_intent?: string | null;
          ai_response_draft?: string | null;
          response_status?: 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam';
          responded_by?: string | null;
          responded_at?: string | null;
        };
        Update: {
          sentiment?: 'positive' | 'neutral' | 'negative' | 'spam' | null;
          priority_score?: number;
          is_business_inquiry?: boolean;
          detected_intent?: string | null;
          ai_response_draft?: string | null;
          response_status?: 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam';
          responded_by?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      direct_messages: {
        Row: {
          id: string;
          account_id: string;
          instagram_thread_id: string | null;
          instagram_msg_id: string | null;
          sender_username: string;
          sender_ig_id: string | null;
          direction: 'inbound' | 'outbound';
          body: string;
          media_url: string | null;
          sentiment: 'positive' | 'neutral' | 'negative' | 'spam' | null;
          priority_score: number;
          is_business_inquiry: boolean;
          ai_response_draft: string | null;
          response_status: 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam';
          responded_by: string | null;
          responded_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          instagram_thread_id?: string | null;
          instagram_msg_id?: string | null;
          sender_username: string;
          sender_ig_id?: string | null;
          direction: 'inbound' | 'outbound';
          body: string;
          media_url?: string | null;
          sentiment?: 'positive' | 'neutral' | 'negative' | 'spam' | null;
          priority_score?: number;
          is_business_inquiry?: boolean;
          ai_response_draft?: string | null;
          response_status?: 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam';
        };
        Update: {
          sentiment?: 'positive' | 'neutral' | 'negative' | 'spam' | null;
          priority_score?: number;
          is_business_inquiry?: boolean;
          ai_response_draft?: string | null;
          response_status?: 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam';
          responded_by?: string | null;
          responded_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      post_metrics_history: {
        Row: {
          id: string;
          post_id: string;
          likes: number;
          comments: number;
          reach: number;
          impressions: number;
          saves: number;
          shares: number;
          engagement_rate: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          likes?: number;
          comments?: number;
          reach?: number;
          impressions?: number;
          saves?: number;
          shares?: number;
          engagement_rate?: number;
          recorded_at?: string;
        };
        Update: {
          likes?: number;
          comments?: number;
          reach?: number;
          impressions?: number;
          saves?: number;
          shares?: number;
          engagement_rate?: number;
        };
        Relationships: [];
      };
      topic_suggestions: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          frequency: number;
          sample_post_ids: string[];
          suggested_keywords: string[];
          status: 'pending' | 'accepted' | 'dismissed';
          client_id: string | null;
          detected_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          frequency?: number;
          sample_post_ids?: string[];
          suggested_keywords?: string[];
          status?: 'pending' | 'accepted' | 'dismissed';
          client_id?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'dismissed';
          client_id?: string | null;
          frequency?: number;
          sample_post_ids?: string[];
          suggested_keywords?: string[];
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_owner_id: string;
          user_id: string;
          role: 'admin' | 'manager' | 'creator' | 'viewer';
          invited_email: string | null;
          invite_status: 'pending' | 'accepted' | 'revoked';
          permissions: Json;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          team_owner_id: string;
          user_id: string;
          role?: 'admin' | 'manager' | 'creator' | 'viewer';
          invited_email?: string | null;
          invite_status?: 'pending' | 'accepted' | 'revoked';
          permissions?: Json;
        };
        Update: {
          role?: 'admin' | 'manager' | 'creator' | 'viewer';
          invite_status?: 'pending' | 'accepted' | 'revoked';
          permissions?: Json;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
      job_logs: {
        Row: {
          id: string;
          job_name: string;
          job_id: string | null;
          status: 'started' | 'completed' | 'failed' | 'retrying';
          payload: Json;
          result: Json;
          error_message: string | null;
          duration_ms: number | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          job_name: string;
          job_id?: string | null;
          status: 'started' | 'completed' | 'failed' | 'retrying';
          payload?: Json;
          result?: Json;
          error_message?: string | null;
          duration_ms?: number | null;
          completed_at?: string | null;
        };
        Update: {
          status?: 'started' | 'completed' | 'failed' | 'retrying';
          result?: Json;
          error_message?: string | null;
          duration_ms?: number | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      api_health_logs: {
        Row: {
          id: string;
          service: 'instagram' | 'gemini' | 'supabase' | 'redis';
          endpoint: string | null;
          status_code: number | null;
          response_time_ms: number | null;
          is_healthy: boolean;
          error_message: string | null;
          checked_at: string;
        };
        Insert: {
          id?: string;
          service: 'instagram' | 'gemini' | 'supabase' | 'redis';
          endpoint?: string | null;
          status_code?: number | null;
          response_time_ms?: number | null;
          is_healthy?: boolean;
          error_message?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          notify_new_comments: boolean;
          notify_new_dms: boolean;
          notify_post_published: boolean;
          notify_post_failed: boolean;
          notify_topic_suggestion: boolean;
          notify_team_activity: boolean;
          default_calendar_view: 'month' | 'week';
          sidebar_collapsed: boolean;
          theme: 'light' | 'dark' | 'system';
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          notify_new_comments?: boolean;
          notify_new_dms?: boolean;
          notify_post_published?: boolean;
          notify_post_failed?: boolean;
          notify_topic_suggestion?: boolean;
          notify_team_activity?: boolean;
          default_calendar_view?: 'month' | 'week';
          sidebar_collapsed?: boolean;
          theme?: 'light' | 'dark' | 'system';
          timezone?: string;
        };
        Update: {
          email_notifications?: boolean;
          push_notifications?: boolean;
          notify_new_comments?: boolean;
          notify_new_dms?: boolean;
          notify_post_published?: boolean;
          notify_post_failed?: boolean;
          notify_topic_suggestion?: boolean;
          notify_team_activity?: boolean;
          default_calendar_view?: 'month' | 'week';
          sidebar_collapsed?: boolean;
          theme?: 'light' | 'dark' | 'system';
          timezone?: string;
        };
        Relationships: [];
      };
      hashtag_performance: {
        Row: {
          id: string;
          account_id: string;
          hashtag: string;
          times_used: number;
          avg_reach: number;
          avg_engagement: number;
          last_used_at: string | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          hashtag: string;
          times_used?: number;
          avg_reach?: number;
          avg_engagement?: number;
          last_used_at?: string | null;
        };
        Update: {
          times_used?: number;
          avg_reach?: number;
          avg_engagement?: number;
          last_used_at?: string | null;
        };
        Relationships: [];
      };
      audience_insights: {
        Row: {
          id: string;
          account_id: string;
          follower_count: number;
          following_count: number;
          age_ranges: Json;
          gender_split: Json;
          top_cities: Json;
          top_countries: Json;
          active_hours: Json;
          active_days: Json;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          follower_count?: number;
          following_count?: number;
          age_ranges?: Json;
          gender_split?: Json;
          top_cities?: Json;
          top_countries?: Json;
          active_hours?: Json;
          active_days?: Json;
        };
        Update: {
          follower_count?: number;
          following_count?: number;
          age_ranges?: Json;
          gender_split?: Json;
          top_cities?: Json;
          top_countries?: Json;
          active_hours?: Json;
          active_days?: Json;
        };
        Relationships: [];
      };
      scheduled_posts: {
        Row: {
          id: string;
          post_id: string;
          account_id: string;
          scheduled_at: string;
          priority: number;
          picked_up: boolean;
          picked_up_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          account_id: string;
          scheduled_at: string;
          priority?: number;
          picked_up?: boolean;
          picked_up_at?: string | null;
        };
        Update: {
          scheduled_at?: string;
          priority?: number;
          picked_up?: boolean;
          picked_up_at?: string | null;
        };
        Relationships: [];
      };
      engagement_rules: {
        Row: {
          id: string;
          account_id: string;
          rule_name: string;
          trigger_type: 'keyword' | 'sentiment' | 'follower_count' | 'is_verified' | 'is_business';
          trigger_value: string;
          action: 'auto_draft' | 'flag_priority' | 'notify_team' | 'ignore';
          response_template: string | null;
          is_active: boolean;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          rule_name: string;
          trigger_type: 'keyword' | 'sentiment' | 'follower_count' | 'is_verified' | 'is_business';
          trigger_value: string;
          action: 'auto_draft' | 'flag_priority' | 'notify_team' | 'ignore';
          response_template?: string | null;
          is_active?: boolean;
          priority?: number;
        };
        Update: {
          rule_name?: string;
          trigger_type?: 'keyword' | 'sentiment' | 'follower_count' | 'is_verified' | 'is_business';
          trigger_value?: string;
          action?: 'auto_draft' | 'flag_priority' | 'notify_team' | 'ignore';
          response_template?: string | null;
          is_active?: boolean;
          priority?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      calc_engagement_rate: {
        Args: {
          p_likes: number;
          p_comments: number;
          p_saves: number;
          p_shares: number;
          p_reach: number;
        };
        Returns: number;
      };
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
