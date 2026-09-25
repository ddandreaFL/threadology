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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      collection_pieces: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          piece_id: string
          position: number | null
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          piece_id: string
          position?: number | null
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          piece_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_pieces_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_pieces_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          password_hash: string | null
          position: number | null
          share_token: string | null
          slug: string
          updated_at: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["container_visibility"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          password_hash?: string | null
          position?: number | null
          share_token?: string | null
          slug: string
          updated_at?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["container_visibility"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          password_hash?: string | null
          position?: number | null
          share_token?: string | null
          slug?: string
          updated_at?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["container_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fit_pieces: {
        Row: {
          created_at: string
          fit_id: string
          id: string
          layer_order: number
          piece_id: string
        }
        Insert: {
          created_at?: string
          fit_id: string
          id?: string
          layer_order?: number
          piece_id: string
        }
        Update: {
          created_at?: string
          fit_id?: string
          id?: string
          layer_order?: number
          piece_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fit_pieces_fit_id_fkey"
            columns: ["fit_id"]
            isOneToOne: false
            referencedRelation: "fits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fit_pieces_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
        ]
      }
      fit_reactions: {
        Row: {
          created_at: string
          emoji: string
          fit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          fit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          fit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fit_reactions_fit_id_fkey"
            columns: ["fit_id"]
            isOneToOne: false
            referencedRelation: "fits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fit_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fits: {
        Row: {
          caption: string | null
          created_at: string
          date: string | null
          id: string
          location: string | null
          password_hash: string | null
          photos: string[]
          share_token: string | null
          slug: string
          title: string | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: Database["public"]["Enums"]["fit_visibility"]
        }
        Insert: {
          caption?: string | null
          created_at?: string
          date?: string | null
          id?: string
          location?: string | null
          password_hash?: string | null
          photos?: string[]
          share_token?: string | null
          slug: string
          title?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["fit_visibility"]
        }
        Update: {
          caption?: string | null
          created_at?: string
          date?: string | null
          id?: string
          location?: string | null
          password_hash?: string | null
          photos?: string[]
          share_token?: string | null
          slug?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["fit_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "fits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          container_id: string
          container_type: string
          created_at: string
          emoji: string | null
          id: string
          kind: string
          piece_count: number
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          container_id: string
          container_type: string
          created_at?: string
          emoji?: string | null
          id?: string
          kind?: string
          piece_count?: number
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          container_id?: string
          container_type?: string
          created_at?: string
          emoji?: string | null
          id?: string
          kind?: string
          piece_count?: number
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_private: {
        Row: {
          estimated_value: number | null
          piece_id: string
          price_paid: number | null
          private_notes: string | null
          updated_at: string
        }
        Insert: {
          estimated_value?: number | null
          piece_id: string
          price_paid?: number | null
          private_notes?: string | null
          updated_at?: string
        }
        Update: {
          estimated_value?: number | null
          piece_id?: string
          price_paid?: number | null
          private_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "piece_private_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: true
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          acquired_at: string | null
          acquired_where: string | null
          acquisition_method: string | null
          brand: string
          condition: string | null
          created_at: string
          crop_positions: Json | null
          id: string
          is_private: boolean
          made_in: string | null
          materials: string | null
          name: string | null
          password_hash: string | null
          photos: string[]
          season: string | null
          share_token: string | null
          size: string | null
          slug: string | null
          story: string | null
          type: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["container_visibility"]
          year: string | null
        }
        Insert: {
          acquired_at?: string | null
          acquired_where?: string | null
          acquisition_method?: string | null
          brand: string
          condition?: string | null
          created_at?: string
          crop_positions?: Json | null
          id?: string
          is_private?: boolean
          made_in?: string | null
          materials?: string | null
          name?: string | null
          password_hash?: string | null
          photos?: string[]
          season?: string | null
          share_token?: string | null
          size?: string | null
          slug?: string | null
          story?: string | null
          type: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["container_visibility"]
          year?: string | null
        }
        Update: {
          acquired_at?: string | null
          acquired_where?: string | null
          acquisition_method?: string | null
          brand?: string
          condition?: string | null
          created_at?: string
          crop_positions?: Json | null
          id?: string
          is_private?: boolean
          made_in?: string | null
          materials?: string | null
          name?: string | null
          password_hash?: string | null
          photos?: string[]
          season?: string | null
          share_token?: string | null
          size?: string | null
          slug?: string | null
          story?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["container_visibility"]
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pieces_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          container_id: string
          container_type: string
          created_at: string
          id: string
          notify: boolean
          owner_id: string | null
          share_token: string | null
          user_id: string
        }
        Insert: {
          container_id: string
          container_type: string
          created_at?: string
          id?: string
          notify?: boolean
          owner_id?: string | null
          share_token?: string | null
          user_id: string
        }
        Update: {
          container_id?: string
          container_type?: string
          created_at?: string
          id?: string
          notify?: boolean
          owner_id?: string | null
          share_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_premium: boolean
          stripe_customer_id: string | null
          username: string
          vault_password_hash: string | null
          vault_share_token: string | null
          vault_visibility: Database["public"]["Enums"]["container_visibility"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          is_premium?: boolean
          stripe_customer_id?: string | null
          username: string
          vault_password_hash?: string | null
          vault_share_token?: string | null
          vault_visibility?: Database["public"]["Enums"]["container_visibility"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean
          stripe_customer_id?: string | null
          username?: string
          vault_password_hash?: string | null
          vault_share_token?: string | null
          vault_visibility?: Database["public"]["Enums"]["container_visibility"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fit_reaction_summary: { Args: { p_fit_id: string }; Returns: Json }
      fit_reactions_for_owner: { Args: { p_fit_id: string }; Returns: Json }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      // Hand-added ahead of users_column_grants.sql; regenerate after it runs.
      my_stripe_customer_id: { Args: never; Returns: string }
      my_vault_share: { Args: never; Returns: Json }
      set_vault_visibility: {
        Args: { p_visibility: Database["public"]["Enums"]["container_visibility"] }
        Returns: undefined
      }
      my_save_state: {
        Args: { p_container_type: string; p_token: string }
        Returns: Json
      }
      my_saves: { Args: never; Returns: Json }
      new_share_token: { Args: never; Returns: string }
      notification_feed: {
        Args: { p_before?: string; p_limit?: number }
        Returns: Json
      }
      notify_savers: {
        Args: {
          p_actor: string
          p_container_id: string
          p_container_type: string
          p_count?: number
        }
        Returns: undefined
      }
      piece_slug: {
        Args: { p_piece: Database["public"]["Tables"]["pieces"]["Row"] }
        Returns: string
      }
      react_to_fit: {
        Args: { p_emoji: string; p_token: string }
        Returns: Json
      }
      resolve_share_token: {
        Args: { p_container_type: string; p_token: string }
        Returns: {
          container_id: string
          owner_id: string
        }[]
      }
      rotate_share_link: {
        Args: { p_container_id?: string; p_container_type: string }
        Returns: string
      }
      save_container: {
        Args: { p_container_type: string; p_notify?: boolean; p_token: string }
        Returns: Json
      }
      set_share_password: {
        Args: {
          p_container_id: string
          p_container_type: string
          p_password: string
        }
        Returns: undefined
      }
      shared_collection: {
        Args: { p_password?: string; p_token: string }
        Returns: Json
      }
      shared_fit: {
        Args: { p_password?: string; p_token: string }
        Returns: Json
      }
      shared_piece: {
        Args: { p_password?: string; p_token: string }
        Returns: Json
      }
      shared_vault: {
        Args: { p_password?: string; p_token: string }
        Returns: Json
      }
      unread_notification_count: { Args: never; Returns: number }
      unsave_container: {
        Args: { p_container_id: string; p_container_type: string }
        Returns: Json
      }
    }
    Enums: {
      container_visibility: "private" | "link_only" | "invite_only"
      fit_visibility: "private" | "link_only" | "public"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      container_visibility: ["private", "link_only", "invite_only"],
      fit_visibility: ["private", "link_only", "public"],
    },
  },
} as const
