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
      tenants: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          room_number: string
          monthly_rent: number
          security_deposit: number
          move_in_date: string
          move_out_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          room_number: string
          monthly_rent: number
          security_deposit: number
          move_in_date: string
          move_out_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          room_number?: string
          monthly_rent?: number
          security_deposit?: number
          move_in_date?: string
          move_out_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          room_number: string
          room_type: string
          monthly_rent: number
          is_occupied: boolean
          floor_number: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_number: string
          room_type: string
          monthly_rent: number
          is_occupied?: boolean
          floor_number: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_number?: string
          room_type?: string
          monthly_rent?: number
          is_occupied?: boolean
          floor_number?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meter_readings: {
        Row: {
          id: string
          tenant_id: string
          reading_date: string
          electricity_reading: number
          electricity_previous: number
          water_reading: number
          water_previous: number
          electricity_units: number
          water_units: number
          electricity_rate: number
          water_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          reading_date: string
          electricity_reading: number
          electricity_previous: number
          water_reading: number
          water_previous: number
          electricity_units: number
          water_units: number
          electricity_rate: number
          water_rate: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          reading_date?: string
          electricity_reading?: number
          electricity_previous?: number
          water_reading?: number
          water_previous?: number
          electricity_units?: number
          water_units?: number
          electricity_rate?: number
          water_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          tenant_id: string
          month_year: string
          room_rent: number
          electricity_amount: number
          water_amount: number
          other_charges: number
          total_amount: number
          due_date: string
          is_paid: boolean
          paid_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          month_year: string
          room_rent: number
          electricity_amount: number
          water_amount: number
          other_charges?: number
          total_amount: number
          due_date: string
          is_paid?: boolean
          paid_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          month_year?: string
          room_rent?: number
          electricity_amount?: number
          water_amount?: number
          other_charges?: number
          total_amount?: number
          due_date?: string
          is_paid?: boolean
          paid_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          bill_id: string | null
          amount: number
          payment_date: string
          payment_method: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          bill_id?: string | null
          amount: number
          payment_date: string
          payment_method: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          bill_id?: string | null
          amount?: number
          payment_date?: string
          payment_method?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
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