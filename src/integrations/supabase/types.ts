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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          apk_url: string
          created_at: string
          force_update: boolean
          id: number
          latest_version: string
          release_notes: string | null
          updated_at: string
          upi_id: string
          upi_payee_name: string
        }
        Insert: {
          apk_url?: string
          created_at?: string
          force_update?: boolean
          id?: number
          latest_version?: string
          release_notes?: string | null
          updated_at?: string
          upi_id?: string
          upi_payee_name?: string
        }
        Update: {
          apk_url?: string
          created_at?: string
          force_update?: boolean
          id?: number
          latest_version?: string
          release_notes?: string | null
          updated_at?: string
          upi_id?: string
          upi_payee_name?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          player_id: string
          reviewed_at: string | null
          status: string
          updated_at: string
          utr: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          player_id: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          utr: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          player_id?: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          utr?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rounds: {
        Row: {
          bet: number
          created_at: string
          details: Json
          game_slug: string
          id: string
          multiplier: number
          payout: number
          user_id: string
        }
        Insert: {
          bet: number
          created_at?: string
          details?: Json
          game_slug: string
          id?: string
          multiplier?: number
          payout?: number
          user_id: string
        }
        Update: {
          bet?: number
          created_at?: string
          details?: Json
          game_slug?: string
          id?: string
          multiplier?: number
          payout?: number
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id: string
          last_bonus_at?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          total_wagered?: number
          total_won?: number
          updated_at?: string
          username: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_bonus_at?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          total_wagered?: number
          total_won?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      public_wins: {
        Row: {
          created_at: string
          game_slug: string
          id: string
          masked_player: string
          multiplier: number
        }
        Insert: {
          created_at?: string
          game_slug: string
          id?: string
          masked_player: string
          multiplier: number
        }
        Update: {
          created_at?: string
          game_slug?: string
          id?: string
          masked_player?: string
          multiplier?: number
        }
        Relationships: []
      }
      quest_claims: {
        Row: {
          created_at: string
          id: string
          player_id: string
          quest_date: string
          quest_key: string
          reward: number
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          quest_date?: string
          quest_key: string
          reward?: number
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          quest_date?: string
          quest_key?: string
          reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_claims_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          method: string
          note: string | null
          player_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          method?: string
          note?: string | null
          player_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          method?: string
          note?: string | null
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_daily_bonus: {
        Args: never
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_quest: {
        Args: { _key: string }
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_referral: {
        Args: { _code: string }
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_player: {
        Args: { _username?: string }
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_referral_code: { Args: never; Returns: string }
      make_deposit: {
        Args: { _amount: number; _method?: string }
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      play_round: {
        Args: {
          _bet: number
          _details?: Json
          _game_slug: string
          _multiplier: number
        }
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: { _amount: number; _method?: string; _note?: string }
        Returns: {
          balance: number
          created_at: string
          id: string
          last_bonus_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          total_wagered: number
          total_won: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_deposit_utr: {
        Args: { _amount: number; _utr: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          method: string
          player_id: string
          reviewed_at: string | null
          status: string
          updated_at: string
          utr: string
        }
        SetofOptions: {
          from: "*"
          to: "deposit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
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
