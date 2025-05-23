export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          hashed_password: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          hashed_password: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          hashed_password?: string
          id?: string
        }
        Relationships: []
      }
      stations: {
        Row: {
          contact_person: string | null
          created_at: string
          description: string | null
          frequency: string
          id: string
          installation_date: string | null
          latitude: number | null
          longitude: number | null
          name: string
          number: string
          position_x: number | null
          position_y: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          description?: string | null
          frequency: string
          id?: string
          installation_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          number: string
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          installation_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          number?: string
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      water_quality: {
        Row: {
          collector_name: string | null
          conductivity: number | null
          created_at: string
          dissolved_oxygen: number | null
          ec: number
          id: string
          measurement_date: string | null
          measurement_time: string | null
          notes: string | null
          ph: number
          station_id: string
          tds: number
          temperature: number
          timestamp: string
          turbidity: number
        }
        Insert: {
          collector_name?: string | null
          conductivity?: number | null
          created_at?: string
          dissolved_oxygen?: number | null
          ec: number
          id?: string
          measurement_date?: string | null
          measurement_time?: string | null
          notes?: string | null
          ph: number
          station_id: string
          tds: number
          temperature: number
          timestamp?: string
          turbidity: number
        }
        Update: {
          collector_name?: string | null
          conductivity?: number | null
          created_at?: string
          dissolved_oxygen?: number | null
          ec?: number
          id?: string
          measurement_date?: string | null
          measurement_time?: string | null
          notes?: string | null
          ph?: number
          station_id?: string
          tds?: number
          temperature?: number
          timestamp?: string
          turbidity?: number
        }
        Relationships: [
          {
            foreignKeyName: "water_quality_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
