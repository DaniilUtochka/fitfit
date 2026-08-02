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
      day_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          is_archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_archived?: boolean
          created_at?: string
        }
        Relationships: []
      }
      template_exercises: {
        Row: {
          id: string
          template_id: string
          exercise_id: string
          position: number
          sets_planned: number
          reps_planned: number
          weight: number | null
        }
        Insert: {
          id?: string
          template_id: string
          exercise_id: string
          position: number
          sets_planned: number
          reps_planned: number
          weight?: number | null
        }
        Update: {
          id?: string
          template_id?: string
          exercise_id?: string
          position?: number
          sets_planned?: number
          reps_planned?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'template_exercises_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'day_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'template_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
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
