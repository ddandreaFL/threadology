// Auto-generated types from Supabase will replace this file.
// Run: npx supabase gen types typescript --project-id <your-project-id> > types/database.ts

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_premium?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      pieces: {
        Row: {
          id: string;
          user_id: string;
          brand: string;
          type: string;
          name: string | null;
          year: string | null;
          season: string | null;
          size: string | null;
          condition: string | null;
          story: string | null;
          photos: string[];
          crop_positions: Record<string, { x: number; y: number }> | null;
          estimated_value: number | null;
          acquisition_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand: string;
          type: string;
          name?: string | null;
          year?: string | null;
          season?: string | null;
          size?: string | null;
          condition?: string | null;
          story?: string | null;
          photos?: string[];
          crop_positions?: Record<string, { x: number; y: number }> | null;
          estimated_value?: number | null;
          acquisition_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand?: string;
          type?: string;
          name?: string | null;
          year?: string | null;
          season?: string | null;
          size?: string | null;
          condition?: string | null;
          story?: string | null;
          photos?: string[];
          crop_positions?: Record<string, { x: number; y: number }> | null;
          estimated_value?: number | null;
          acquisition_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pieces_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      fits: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          title: string | null;
          photos: string[];
          caption: string | null;
          date: string | null;
          location: string | null;
          visibility: "private" | "link_only" | "public";
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          title?: string | null;
          photos?: string[];
          caption?: string | null;
          date?: string | null;
          location?: string | null;
          visibility?: "private" | "link_only" | "public";
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          title?: string | null;
          photos?: string[];
          caption?: string | null;
          date?: string | null;
          location?: string | null;
          visibility?: "private" | "link_only" | "public";
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      fit_pieces: {
        Row: {
          id: string;
          fit_id: string;
          piece_id: string;
          layer_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          fit_id: string;
          piece_id: string;
          layer_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          fit_id?: string;
          piece_id?: string;
          layer_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fit_pieces_fit_id_fkey";
            columns: ["fit_id"];
            isOneToOne: false;
            referencedRelation: "fits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fit_pieces_piece_id_fkey";
            columns: ["piece_id"];
            isOneToOne: false;
            referencedRelation: "pieces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      fit_visibility: "private" | "link_only" | "public";
    };
  };
};
