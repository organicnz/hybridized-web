export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bands: {
        Row: {
          id: number
          created_at: string
          name: string | null
          description: string | null
          formula: string | null
          id_new: number | null
          iframe_url: string | null
          cover_url: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          description?: string | null
          formula?: string | null
          id_new?: number | null
          iframe_url?: string | null
          cover_url?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          description?: string | null
          formula?: string | null
          id_new?: number | null
          iframe_url?: string | null
          cover_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
      }
    }
  }
}
