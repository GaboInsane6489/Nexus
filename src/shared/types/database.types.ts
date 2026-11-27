export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      academic_terms: {
        Row: {
          code: string;
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
          status: Database['public']['Enums']['term_status'];
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
          status?: Database['public']['Enums']['term_status'];
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
          status?: Database['public']['Enums']['term_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance_justifications: {
        Row: {
          attendance_record_id: string;
          created_at: string;
          evidence_file_url: string | null;
          id: string;
          reason: string;
          requested_by: string;
          resolved_at: string | null;
          reviewed_by: string | null;
          status: Database['public']['Enums']['rectification_status'];
          updated_at: string;
        };
        Insert: {
          attendance_record_id: string;
          created_at?: string;
          evidence_file_url?: string | null;
          id?: string;
          reason: string;
          requested_by: string;
          resolved_at?: string | null;
          reviewed_by?: string | null;
          status?: Database['public']['Enums']['rectification_status'];
          updated_at?: string;
        };
        Update: {
          attendance_record_id?: string;
          created_at?: string;
          evidence_file_url?: string | null;
          id?: string;
          reason?: string;
          requested_by?: string;
          resolved_at?: string | null;
          reviewed_by?: string | null;
          status?: Database['public']['Enums']['rectification_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          enrollment_id: string;
          id: string;
          recorded_at: string;
          recorded_by: string | null;
          session_id: string;
          status: Database['public']['Enums']['attendance_status'];
          updated_at: string;
        };
        Insert: {
          enrollment_id: string;
          id?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          session_id: string;
          status?: Database['public']['Enums']['attendance_status'];
          updated_at?: string;
        };
        Update: {
          enrollment_id?: string;
          id?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          session_id?: string;
          status?: Database['public']['Enums']['attendance_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action_code: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_table: string;
          id: string;
          ip_address: string | null;
          new_data: Json | null;
          previous_data: Json | null;
        };
        Insert: {
          action_code: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_table: string;
          id?: string;
          ip_address?: string | null;
          new_data?: Json | null;
          previous_data?: Json | null;
        };
        Update: {
          action_code?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_table?: string;
          id?: string;
          ip_address?: string | null;
          new_data?: Json | null;
          previous_data?: Json | null;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          code: string;
          created_at: string;
          description: string;
          icon_key: string;
          id: string;
          name: string;
          xp_bonus: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          description: string;
          icon_key?: string;
          id?: string;
          name: string;
          xp_bonus?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string;
          icon_key?: string;
          id?: string;
          name?: string;
          xp_bonus?: number;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          academic_credits_snapshot: number;
          attendance_pct_snapshot: number;
          course_code_snapshot: string;
          course_id: string;
          course_title_snapshot: string;
          enrollment_id: string | null;
          final_grade_snapshot: number;
          id: string;
          is_revoked: boolean;
          issued_at: string;
          pdf_storage_path: string | null;
          revoked_reason: string | null;
          signature_hash: string;
          student_document_snapshot: string;
          student_full_name_snapshot: string;
          student_id: string | null;
          verification_code: string;
        };
        Insert: {
          academic_credits_snapshot?: number;
          attendance_pct_snapshot: number;
          course_code_snapshot: string;
          course_id: string;
          course_title_snapshot: string;
          enrollment_id?: string | null;
          final_grade_snapshot: number;
          id?: string;
          is_revoked?: boolean;
          issued_at?: string;
          pdf_storage_path?: string | null;
          revoked_reason?: string | null;
          signature_hash: string;
          student_document_snapshot: string;
          student_full_name_snapshot: string;
          student_id?: string | null;
          verification_code: string;
        };
        Update: {
          academic_credits_snapshot?: number;
          attendance_pct_snapshot?: number;
          course_code_snapshot?: string;
          course_id?: string;
          course_title_snapshot?: string;
          enrollment_id?: string | null;
          final_grade_snapshot?: number;
          id?: string;
          is_revoked?: boolean;
          issued_at?: string;
          pdf_storage_path?: string | null;
          revoked_reason?: string | null;
          signature_hash?: string;
          student_document_snapshot?: string;
          student_full_name_snapshot?: string;
          student_id?: string | null;
          verification_code?: string;
        };
        Relationships: [];
      };
      class_sessions: {
        Row: {
          cohort_id: string;
          created_at: string;
          ends_at: string;
          id: string;
          is_attendance_taken: boolean;
          meeting_or_room_url: string | null;
          session_number: number;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          cohort_id: string;
          created_at?: string;
          ends_at: string;
          id?: string;
          is_attendance_taken?: boolean;
          meeting_or_room_url?: string | null;
          session_number: number;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          cohort_id?: string;
          created_at?: string;
          ends_at?: string;
          id?: string;
          is_attendance_taken?: boolean;
          meeting_or_room_url?: string | null;
          session_number?: number;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cohorts: {
        Row: {
          academic_term_id: string;
          closed_at: string | null;
          closed_by: string | null;
          code: string;
          course_id: string;
          created_at: string;
          end_date: string;
          enrolled_count: number;
          id: string;
          instructor_id: string | null;
          max_students: number;
          name: string;
          schedule_label: string;
          start_date: string;
          status: Database['public']['Enums']['cohort_status'];
          updated_at: string;
        };
        Insert: {
          academic_term_id: string;
          closed_at?: string | null;
          closed_by?: string | null;
          code: string;
          course_id: string;
          created_at?: string;
          end_date: string;
          enrolled_count?: number;
          id?: string;
          instructor_id?: string | null;
          max_students?: number;
          name: string;
          schedule_label?: string;
          start_date: string;
          status?: Database['public']['Enums']['cohort_status'];
          updated_at?: string;
        };
        Update: {
          academic_term_id?: string;
          closed_at?: string | null;
          closed_by?: string | null;
          code?: string;
          course_id?: string;
          created_at?: string;
          end_date?: string;
          enrolled_count?: number;
          id?: string;
          instructor_id?: string | null;
          max_students?: number;
          name?: string;
          schedule_label?: string;
          start_date?: string;
          status?: Database['public']['Enums']['cohort_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string;
          current_uses: number;
          description: string;
          discount_pct: number;
          id: string;
          is_active: boolean;
          max_uses: number;
          updated_at: string;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          current_uses?: number;
          description: string;
          discount_pct?: number;
          id?: string;
          is_active?: boolean;
          max_uses?: number;
          updated_at?: string;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          current_uses?: number;
          description?: string;
          discount_pct?: number;
          id?: string;
          is_active?: boolean;
          max_uses?: number;
          updated_at?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      course_modules: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_prerequisites: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          min_grade_required: number;
          required_course_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          min_grade_required?: number;
          required_course_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          min_grade_required?: number;
          required_course_id?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          academic_credits: number;
          code: string;
          created_at: string;
          id: string;
          is_published: boolean;
          level_label: string;
          min_attendance_pct: number;
          min_passing_grade: number;
          price_individual: number;
          slug: string;
          summary: string;
          title: string;
          total_hours: number;
          updated_at: string;
        };
        Insert: {
          academic_credits?: number;
          code: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          level_label?: string;
          min_attendance_pct?: number;
          min_passing_grade?: number;
          price_individual?: number;
          slug: string;
          summary: string;
          title: string;
          total_hours?: number;
          updated_at?: string;
        };
        Update: {
          academic_credits?: number;
          code?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          level_label?: string;
          min_attendance_pct?: number;
          min_passing_grade?: number;
          price_individual?: number;
          slug?: string;
          summary?: string;
          title?: string;
          total_hours?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          academic_risk_level: Database['public']['Enums']['risk_level'];
          attendance_pct: number;
          cohort_id: string;
          completed_at: string | null;
          enrolled_at: string;
          final_grade: number;
          id: string;
          order_id: string | null;
          status: Database['public']['Enums']['enrollment_status'];
          student_id: string;
          updated_at: string;
        };
        Insert: {
          academic_risk_level?: Database['public']['Enums']['risk_level'];
          attendance_pct?: number;
          cohort_id: string;
          completed_at?: string | null;
          enrolled_at?: string;
          final_grade?: number;
          id?: string;
          order_id?: string | null;
          status?: Database['public']['Enums']['enrollment_status'];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          academic_risk_level?: Database['public']['Enums']['risk_level'];
          attendance_pct?: number;
          cohort_id?: string;
          completed_at?: string | null;
          enrolled_at?: string;
          final_grade?: number;
          id?: string;
          order_id?: string | null;
          status?: Database['public']['Enums']['enrollment_status'];
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evaluation_items: {
        Row: {
          allow_late_submission: boolean;
          cohort_id: string;
          created_at: string;
          due_date: string;
          id: string;
          sort_order: number;
          title: string;
          type: Database['public']['Enums']['evaluation_type'];
          updated_at: string;
          weight_pct: number;
        };
        Insert: {
          allow_late_submission?: boolean;
          cohort_id: string;
          created_at?: string;
          due_date: string;
          id?: string;
          sort_order?: number;
          title: string;
          type?: Database['public']['Enums']['evaluation_type'];
          updated_at?: string;
          weight_pct: number;
        };
        Update: {
          allow_late_submission?: boolean;
          cohort_id?: string;
          created_at?: string;
          due_date?: string;
          id?: string;
          sort_order?: number;
          title?: string;
          type?: Database['public']['Enums']['evaluation_type'];
          updated_at?: string;
          weight_pct?: number;
        };
        Relationships: [];
      };
      grade_rectifications: {
        Row: {
          approved_by_coordinator_id: string | null;
          created_at: string;
          evidence_url: string | null;
          id: string;
          justification_reason: string;
          new_score: number;
          previous_score: number;
          requested_by_instructor_id: string;
          resolved_at: string | null;
          status: Database['public']['Enums']['rectification_status'];
          submission_id: string;
          updated_at: string;
        };
        Insert: {
          approved_by_coordinator_id?: string | null;
          created_at?: string;
          evidence_url?: string | null;
          id?: string;
          justification_reason: string;
          new_score: number;
          previous_score: number;
          requested_by_instructor_id: string;
          resolved_at?: string | null;
          status?: Database['public']['Enums']['rectification_status'];
          submission_id: string;
          updated_at?: string;
        };
        Update: {
          approved_by_coordinator_id?: string | null;
          created_at?: string;
          evidence_url?: string | null;
          id?: string;
          justification_reason?: string;
          new_score?: number;
          previous_score?: number;
          requested_by_instructor_id?: string;
          resolved_at?: string | null;
          status?: Database['public']['Enums']['rectification_status'];
          submission_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_path_items: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          is_mandatory: boolean;
          learning_path_id: string;
          step_order: number;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          is_mandatory?: boolean;
          learning_path_id: string;
          step_order?: number;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          is_mandatory?: boolean;
          learning_path_id?: string;
          step_order?: number;
        };
        Relationships: [];
      };
      learning_paths: {
        Row: {
          created_at: string;
          estimated_weeks: number;
          faculty_name: string;
          icon_key: string;
          id: string;
          is_published: boolean;
          price_bundle: number;
          slug: string;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          estimated_weeks?: number;
          faculty_name: string;
          icon_key?: string;
          id?: string;
          is_published?: boolean;
          price_bundle?: number;
          slug: string;
          summary: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          estimated_weeks?: number;
          faculty_name?: string;
          icon_key?: string;
          id?: string;
          is_published?: boolean;
          price_bundle?: number;
          slug?: string;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          completed_at: string | null;
          enrollment_id: string;
          id: string;
          is_completed: boolean;
          lesson_id: string;
          updated_at: string;
          watched_seconds: number;
        };
        Insert: {
          completed_at?: string | null;
          enrollment_id: string;
          id?: string;
          is_completed?: boolean;
          lesson_id: string;
          updated_at?: string;
          watched_seconds?: number;
        };
        Update: {
          completed_at?: string | null;
          enrollment_id?: string;
          id?: string;
          is_completed?: boolean;
          lesson_id?: string;
          updated_at?: string;
          watched_seconds?: number;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          content_type: Database['public']['Enums']['lesson_content_type'];
          created_at: string;
          duration_minutes: number;
          id: string;
          is_free_preview: boolean;
          markdown_body: string | null;
          module_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          content_type?: Database['public']['Enums']['lesson_content_type'];
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          is_free_preview?: boolean;
          markdown_body?: string | null;
          module_id: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          content_type?: Database['public']['Enums']['lesson_content_type'];
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          is_free_preview?: boolean;
          markdown_body?: string | null;
          module_id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          course_id: string | null;
          created_at: string;
          id: string;
          item_type: Database['public']['Enums']['order_item_type'];
          learning_path_id: string | null;
          order_id: string;
          target_cohort_id: string | null;
          unit_price: number;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          item_type?: Database['public']['Enums']['order_item_type'];
          learning_path_id?: string | null;
          order_id: string;
          target_cohort_id?: string | null;
          unit_price?: number;
        };
        Update: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          item_type?: Database['public']['Enums']['order_item_type'];
          learning_path_id?: string | null;
          order_id?: string;
          target_cohort_id?: string | null;
          unit_price?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          coupon_id: string | null;
          created_at: string;
          currency: string;
          discount_amount: number;
          id: string;
          invoice_number: string;
          method: Database['public']['Enums']['payment_method'];
          paid_at: string | null;
          payment_status: Database['public']['Enums']['order_status'];
          provider_reference: string | null;
          receipt_file_url: string | null;
          reviewed_by: string | null;
          student_id: string;
          subtotal_amount: number;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          coupon_id?: string | null;
          created_at?: string;
          currency?: string;
          discount_amount?: number;
          id?: string;
          invoice_number: string;
          method?: Database['public']['Enums']['payment_method'];
          paid_at?: string | null;
          payment_status?: Database['public']['Enums']['order_status'];
          provider_reference?: string | null;
          receipt_file_url?: string | null;
          reviewed_by?: string | null;
          student_id: string;
          subtotal_amount?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          coupon_id?: string | null;
          created_at?: string;
          currency?: string;
          discount_amount?: number;
          id?: string;
          invoice_number?: string;
          method?: Database['public']['Enums']['payment_method'];
          paid_at?: string | null;
          payment_status?: Database['public']['Enums']['order_status'];
          provider_reference?: string | null;
          receipt_file_url?: string | null;
          reviewed_by?: string | null;
          student_id?: string;
          subtotal_amount?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      path_entitlements: {
        Row: {
          consumed_enrollment_id: string | null;
          course_id: string;
          created_at: string;
          id: string;
          is_consumed: boolean;
          learning_path_id: string;
          order_id: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          consumed_enrollment_id?: string | null;
          course_id: string;
          created_at?: string;
          id?: string;
          is_consumed?: boolean;
          learning_path_id: string;
          order_id: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          consumed_enrollment_id?: string | null;
          course_id?: string;
          created_at?: string;
          id?: string;
          is_consumed?: boolean;
          learning_path_id?: string;
          order_id?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          document_id: string | null;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          timezone: string;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          document_id?: string | null;
          email: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          timezone?: string;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          document_id?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          timezone?: string;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          enrollment_id: string;
          evaluation_id: string;
          file_url: string | null;
          graded_at: string | null;
          graded_by: string | null;
          id: string;
          instructor_feedback: string | null;
          score: number | null;
          submission_text: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          enrollment_id: string;
          evaluation_id: string;
          file_url?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          instructor_feedback?: string | null;
          score?: number | null;
          submission_text?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          enrollment_id?: string;
          evaluation_id?: string;
          file_url?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          instructor_feedback?: string | null;
          score?: number | null;
          submission_text?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          awarded_at: string;
          badge_id: string;
          cohort_id: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          awarded_at?: string;
          badge_id: string;
          cohort_id?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          awarded_at?: string;
          badge_id?: string;
          cohort_id?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_gamification: {
        Row: {
          current_level: number;
          current_streak_days: number;
          last_activity_date: string | null;
          longest_streak_days: number;
          streak_freezes_available: number;
          total_xp: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          current_level?: number;
          current_streak_days?: number;
          last_activity_date?: string | null;
          longest_streak_days?: number;
          streak_freezes_available?: number;
          total_xp?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          current_level?: number;
          current_streak_days?: number;
          last_activity_date?: string | null;
          longest_streak_days?: number;
          streak_freezes_available?: number;
          total_xp?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      xp_ledger: {
        Row: {
          base_xp: number;
          created_at: string;
          event_type: string;
          final_xp_awarded: number;
          id: string;
          multiplier: number;
          reference_id: string;
          user_id: string;
        };
        Insert: {
          base_xp: number;
          created_at?: string;
          event_type: string;
          final_xp_awarded: number;
          id?: string;
          multiplier?: number;
          reference_id: string;
          user_id: string;
        };
        Update: {
          base_xp?: number;
          created_at?: string;
          event_type?: string;
          final_xp_awarded?: number;
          id?: string;
          multiplier?: number;
          reference_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: never;
        Returns: Database['public']['Enums']['app_role'];
      };
      fn_calculate_level_from_xp: {
        Args: { p_total_xp: number };
        Returns: number;
      };
      fn_check_cohort_enrollment_eligibility: {
        Args: { p_cohort_id: string; p_student_id: string };
        Returns: Json;
      };
      fn_get_cohort_erp_audit: {
        Args: { p_cohort_id: string };
        Returns: Json;
      };
      fn_get_executive_analytics_snapshot: {
        Args: never;
        Returns: Json;
      };
      fn_verify_certificate_by_code: {
        Args: { p_verification_code: string };
        Returns: Json;
      };
      is_admin_or_coordinator: { Args: never; Returns: boolean };
      is_cohort_instructor: {
        Args: { target_cohort_id: string };
        Returns: boolean;
      };
      is_super_admin: { Args: never; Returns: boolean };
      rpc_assign_user_role: {
        Args: {
          new_role: Database['public']['Enums']['app_role'];
          reason?: string;
          target_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: 'super_admin' | 'coordinator' | 'instructor' | 'student';
      attendance_status: 'present' | 'late' | 'absent' | 'excused';
      cohort_status: 'upcoming' | 'active' | 'grading' | 'closed' | 'cancelled';
      enrollment_status:
        | 'active'
        | 'completed'
        | 'failed_grade'
        | 'failed_attendance'
        | 'dropped';
      evaluation_type:
        | 'exam'
        | 'quiz'
        | 'assignment'
        | 'project'
        | 'participation';
      lesson_content_type: 'video' | 'reading' | 'resource' | 'quiz_link';
      order_item_type: 'single_course' | 'learning_path' | 'retake_fee';
      order_status: 'pending' | 'under_review' | 'paid' | 'failed' | 'refunded';
      payment_method: 'stripe' | 'mercadopago' | 'bank_transfer' | 'scholarship';
      rectification_status: 'pending' | 'approved' | 'rejected';
      risk_level: 'normal' | 'warning' | 'critical_dropout_risk';
      term_status: 'planning' | 'enrollment_open' | 'in_progress' | 'closed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type AppRole = Database['public']['Enums']['app_role'];
export type TermStatus = Database['public']['Enums']['term_status'];
export type LessonContentType = Database['public']['Enums']['lesson_content_type'];
export type CohortStatus = Database['public']['Enums']['cohort_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type OrderItemType = Database['public']['Enums']['order_item_type'];
export type EnrollmentStatus = Database['public']['Enums']['enrollment_status'];
export type RiskLevel = Database['public']['Enums']['risk_level'];

export type DatabaseProfileRow = Database['public']['Tables']['profiles']['Row'];
export type DatabaseUserRoleRow = Database['public']['Tables']['user_roles']['Row'];
export type DatabaseAuditLogRow = Database['public']['Tables']['audit_logs']['Row'];
