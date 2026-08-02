// Типы схемы БД (формат `supabase gen types typescript`).
// Написаны вручную под миграцию 20260802050245_exercises.sql; при желании
// перегенерируются командой gen types и должны совпасть.

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
      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          is_bodyweight: boolean
          video_url: string | null
          note: string | null
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          is_bodyweight?: boolean
          video_url?: string | null
          note?: string | null
          is_archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_bodyweight?: boolean
          video_url?: string | null
          note?: string | null
          is_archived?: boolean
          created_at?: string
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      exercise_muscle_groups: {
        Row: {
          exercise_id: string
          muscle_group_id: number
          is_primary: boolean
        }
        Insert: {
          exercise_id: string
          muscle_group_id: number
          is_primary?: boolean
        }
        Update: {
          exercise_id?: string
          muscle_group_id?: number
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'exercise_muscle_groups_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'exercise_muscle_groups_muscle_group_id_fkey'
            columns: ['muscle_group_id']
            isOneToOne: false
            referencedRelation: 'muscle_groups'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
