export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_ratings: {
        Row: {
          agent_id: string
          communication_rating: number | null
          created_at: string | null
          id: string
          is_verified_transaction: boolean | null
          knowledge_rating: number | null
          overall_rating: number
          professionalism_rating: number | null
          property_id: string | null
          rated_by: string
          responsiveness_rating: number | null
          review_text: string | null
          review_title: string | null
        }
        Insert: {
          agent_id: string
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified_transaction?: boolean | null
          knowledge_rating?: number | null
          overall_rating: number
          professionalism_rating?: number | null
          property_id?: string | null
          rated_by: string
          responsiveness_rating?: number | null
          review_text?: string | null
          review_title?: string | null
        }
        Update: {
          agent_id?: string
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified_transaction?: boolean | null
          knowledge_rating?: number | null
          overall_rating?: number
          professionalism_rating?: number | null
          property_id?: string | null
          rated_by?: string
          responsiveness_rating?: number | null
          review_text?: string | null
          review_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_ratings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_ratings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "agent_ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reviews: {
        Row: {
          agent_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reservation_id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reservation_id: string
          user_id: string
        }
        Update: {
          agent_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reservation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agent_reviews_reservation"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_verifications: {
        Row: {
          admin_notes: string | null
          agent_id: string
          average_rating: number | null
          badge_earned_at: string | null
          business_address: string | null
          business_license_url: string | null
          business_name: string | null
          created_at: string | null
          id: string
          id_document_back_url: string | null
          id_document_front_url: string | null
          paid_at: string | null
          payment_reference: string | null
          professional_certificate_url: string | null
          proof_of_address_url: string | null
          rejection_reason: string | null
          specializations: string[] | null
          total_commission_earned: number | null
          total_properties_rented: number | null
          total_properties_sold: number | null
          total_reviews: number | null
          updated_at: string | null
          verification_badge: string | null
          verification_fee_amount: number | null
          verification_fee_paid: boolean | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          years_of_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          agent_id: string
          average_rating?: number | null
          badge_earned_at?: string | null
          business_address?: string | null
          business_license_url?: string | null
          business_name?: string | null
          created_at?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          professional_certificate_url?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          specializations?: string[] | null
          total_commission_earned?: number | null
          total_properties_rented?: number | null
          total_properties_sold?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_badge?: string | null
          verification_fee_amount?: number | null
          verification_fee_paid?: boolean | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          agent_id?: string
          average_rating?: number | null
          badge_earned_at?: string | null
          business_address?: string | null
          business_license_url?: string | null
          business_name?: string | null
          created_at?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          professional_certificate_url?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          specializations?: string[] | null
          total_commission_earned?: number | null
          total_properties_rented?: number | null
          total_properties_sold?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_badge?: string | null
          verification_fee_amount?: number | null
          verification_fee_paid?: boolean | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_verifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_disputes: {
        Row: {
          commission_payment_id: string
          created_at: string | null
          description: string
          dispute_type: string
          id: string
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          commission_payment_id: string
          created_at?: string | null
          description: string
          dispute_type: string
          id?: string
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          commission_payment_id?: string
          created_at?: string | null
          description?: string
          dispute_type?: string
          id?: string
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_disputes_commission_payment_id_fkey"
            columns: ["commission_payment_id"]
            isOneToOne: false
            referencedRelation: "commission_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          agent_amount: number
          agent_id: string
          amount: number
          created_at: string | null
          dispute_reason: string | null
          escrow_status: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          platform_fee: number
          property_id: string
          release_conditions: string | null
          release_date: string | null
          released_at: string | null
          reservation_id: string
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_amount: number
          agent_id: string
          amount: number
          created_at?: string | null
          dispute_reason?: string | null
          escrow_status?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          platform_fee: number
          property_id: string
          release_conditions?: string | null
          release_date?: string | null
          released_at?: string | null
          reservation_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_amount?: number
          agent_id?: string
          amount?: number
          created_at?: string | null
          dispute_reason?: string | null
          escrow_status?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          platform_fee?: number
          property_id?: string
          release_conditions?: string | null
          release_date?: string | null
          released_at?: string | null
          reservation_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "commission_payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string | null
          device_token: string
          device_type: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_token: string
          device_type: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_token?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          property_id: string | null
          read: boolean | null
          receiver_id: string
          reply_to: string | null
          sender_id: string
          voice_url: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          read?: boolean | null
          receiver_id: string
          reply_to?: string | null
          sender_id: string
          voice_url?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          read?: boolean | null
          receiver_id?: string
          reply_to?: string | null
          sender_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          average_rating: number | null
          badge_earned_at: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          emergency_contact: Json | null
          full_name: string
          gender: string | null
          id: string
          is_public: boolean | null
          is_verified_agent: boolean | null
          last_seen: string | null
          location: string | null
          occupation: string | null
          phone: string | null
          preferences: Json | null
          role: string
          social_links: Json | null
          total_properties: number | null
          total_reviews: number | null
          updated_at: string | null
          verification_badge: string | null
          verification_token: string | null
          verification_token_expires_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          badge_earned_at?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          emergency_contact?: Json | null
          full_name: string
          gender?: string | null
          id?: string
          is_public?: boolean | null
          is_verified_agent?: boolean | null
          last_seen?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string
          social_links?: Json | null
          total_properties?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_badge?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          badge_earned_at?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          emergency_contact?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          is_public?: boolean | null
          is_verified_agent?: boolean | null
          last_seen?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string
          social_links?: Json | null
          total_properties?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_badge?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          advance_months_max: number | null
          advance_months_min: number | null
          amenities: string[] | null
          area: number | null
          average_rating: number | null
          bathroom: number | null
          bathrooms: number | null
          bedrooms: number | null
          category: string
          created_at: string | null
          description: string
          feature_priority: number | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          kitchen: number | null
          last_viewed_at: string | null
          latitude: number | null
          location: string
          longitude: number | null
          owner_id: string
          price: number
          property_type: string | null
          rent_period: string | null
          reservation_fee: number | null
          status: string | null
          title: string
          total_reviews: number | null
          type: string
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          view_count: number | null
        }
        Insert: {
          advance_months_max?: number | null
          advance_months_min?: number | null
          amenities?: string[] | null
          area?: number | null
          average_rating?: number | null
          bathroom?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          category: string
          created_at?: string | null
          description: string
          feature_priority?: number | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          kitchen?: number | null
          last_viewed_at?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          owner_id: string
          price: number
          property_type?: string | null
          reservation_fee?: number | null
          status?: string | null
          title: string
          total_reviews?: number | null
          type: string
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          view_count?: number | null
        }
        Update: {
          advance_months_max?: number | null
          advance_months_min?: number | null
          amenities?: string[] | null
          area?: number | null
          average_rating?: number | null
          bathroom?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          category?: string
          created_at?: string | null
          description?: string
          feature_priority?: number | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          kitchen?: number | null
          last_viewed_at?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          owner_id?: string
          price?: number
          property_type?: string | null
          reservation_fee?: number | null
          status?: string | null
          title?: string
          total_reviews?: number | null
          type?: string
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_documents: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_required: boolean | null
          is_sensitive: boolean | null
          mime_type: string | null
          property_id: string
          rejection_reason: string | null
          updated_at: string | null
          uploaded_by: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          mime_type?: string | null
          property_id: string
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_by: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          mime_type?: string | null
          property_id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_by?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          property_id: string
          rating: number
          reservation_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          property_id: string
          rating: number
          reservation_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          property_id?: string
          rating?: number
          reservation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_property_reviews_reservation"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_verification_requirements: {
        Row: {
          description: string | null
          document_type: string
          id: string
          is_required: boolean | null
          property_type: string
        }
        Insert: {
          description?: string | null
          document_type: string
          id?: string
          is_required?: boolean | null
          property_type: string
        }
        Update: {
          description?: string | null
          document_type?: string
          id?: string
          is_required?: boolean | null
          property_type?: string
        }
        Relationships: []
      }
      property_views: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: unknown | null
          platform: string | null
          property_id: string
          session_id: string | null
          source: string | null
          user_agent: string | null
          view_duration_seconds: number | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          platform?: string | null
          property_id: string
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
          view_duration_seconds?: number | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          platform?: string | null
          property_id?: string
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
          view_duration_seconds?: number | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          amount: number
          cancellation_reason: string | null
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          property_id: string
          refund_approved: boolean | null
          refund_number: string | null
          refund_requested: boolean | null
          refund_status: string | null
          reservation_date: string
          reservation_fee: number | null
          reservation_time: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          property_id: string
          refund_approved?: boolean | null
          refund_number?: string | null
          refund_requested?: boolean | null
          refund_status?: string | null
          reservation_date: string
          reservation_fee?: number | null
          reservation_time?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          property_id?: string
          refund_approved?: boolean | null
          refund_number?: string | null
          refund_requested?: boolean | null
          refund_status?: string | null
          reservation_date?: string
          reservation_fee?: number | null
          reservation_time?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          property_id: string | null
          reference: string
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          property_id?: string | null
          reference: string
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          property_id?: string | null
          reference?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          last_updated: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          last_updated?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          last_updated?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string | null
          failure_reason: string | null
          fapshi_reference: string | null
          id: string
          phone: string
          processed_at: string | null
          requested_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          failure_reason?: string | null
          fapshi_reference?: string | null
          id?: string
          phone: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          failure_reason?: string | null
          fapshi_reference?: string | null
          id?: string
          phone?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      property_analytics_summary: {
        Row: {
          last_viewed_at: string | null
          most_common_source: string | null
          owner_id: string | null
          property_id: string | null
          title: string | null
          total_views_detailed: number | null
          unique_viewers: number | null
          view_count: number | null
          views_this_month: number | null
          views_this_week: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      available_withdrawable_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      determine_agent_badge: {
        Args: { agent_id: string }
        Returns: string
      }
      get_agent_total_views: {
        Args: { agent_uuid: string }
        Returns: number
      }
      get_property_view_stats: {
        Args: { property_uuid: string }
        Returns: {
          top_sources: string[]
          total_views: number
          unique_viewers: number
          views_this_month: number
          views_this_week: number
          views_today: number
        }[]
      }
      locked_visitation_amount: {
        Args: { p_user_id: string }
        Returns: number
      }
      request_withdrawal: {
        Args: { p_amount: number; p_phone: string }
        Returns: {
          accepted: boolean
          available: number
        }[]
      }
      update_wallet_balance: {
        Args: { amount_to_subtract: number; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
