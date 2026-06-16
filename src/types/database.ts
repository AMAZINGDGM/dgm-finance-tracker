export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          preferred_language: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_language?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_language?: string;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          name: string;
          type: string;
          initial_balance: number;
          current_balance: number;
          color: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          name: string;
          type: string;
          initial_balance?: number;
          current_balance?: number;
          color?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          workspace_id?: string | null;
          type?: string;
          initial_balance?: number;
          current_balance?: number;
          color?: string | null;
          icon?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          name: string;
          type: string;
          color: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          name: string;
          type: string;
          color?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          workspace_id?: string | null;
          type?: string;
          color?: string | null;
          icon?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          type: string;
          amount: number;
          category_id: string | null;
          account_id: string | null;
          transfer_from_account_id: string | null;
          transfer_to_account_id: string | null;
          date: string;
          note: string | null;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          type: string;
          amount: number;
          category_id?: string | null;
          account_id?: string | null;
          transfer_from_account_id?: string | null;
          transfer_to_account_id?: string | null;
          date: string;
          note?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: string;
          workspace_id?: string | null;
          amount?: number;
          category_id?: string | null;
          account_id?: string | null;
          transfer_from_account_id?: string | null;
          transfer_to_account_id?: string | null;
          date?: string;
          note?: string | null;
          source?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          category_id: string;
          month: number;
          year: number;
          limit_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          category_id: string;
          month: number;
          year: number;
          limit_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          workspace_id?: string | null;
          month?: number;
          year?: number;
          limit_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          name: string;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          workspace_id?: string | null;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
          icon?: string | null;
          color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          name: string;
          brand: string | null;
          category: string | null;
          sku: string | null;
          cost_price: number;
          selling_price: number;
          stock_quantity: number;
          low_stock_threshold: number;
          condition: string | null;
          notes: string | null;
          sold_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          name: string;
          brand?: string | null;
          category?: string | null;
          sku?: string | null;
          cost_price?: number;
          selling_price?: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          condition?: string | null;
          notes?: string | null;
          sold_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          name?: string;
          brand?: string | null;
          category?: string | null;
          sku?: string | null;
          cost_price?: number;
          selling_price?: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          condition?: string | null;
          notes?: string | null;
          sold_quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      capital_entries: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          type: string;
          amount: number;
          account_id: string | null;
          date: string;
          notes: string | null;
          source: string | null;
          reference: string | null;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          type: string;
          amount?: number;
          account_id?: string | null;
          date?: string;
          notes?: string | null;
          source?: string | null;
          reference?: string | null;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          type?: string;
          amount?: number;
          account_id?: string | null;
          date?: string;
          notes?: string | null;
          source?: string | null;
          reference?: string | null;
          payment_method?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          type: string;
          amount: number;
          category_id: string | null;
          account_id: string | null;
          frequency: string;
          start_date: string;
          end_date: string | null;
          note: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          type: string;
          amount: number;
          category_id?: string | null;
          account_id?: string | null;
          frequency: string;
          start_date: string;
          end_date?: string | null;
          note?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: string;
          workspace_id?: string | null;
          amount?: number;
          category_id?: string | null;
          account_id?: string | null;
          frequency?: string;
          start_date?: string;
          end_date?: string | null;
          note?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_logs: {
        Row: {
          id: string;
          user_id: string;
          message: string | null;
          parsed_result: Json | null;
          action: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message?: string | null;
          parsed_result?: Json | null;
          action?: string | null;
          created_at?: string;
        };
        Update: {
          message?: string | null;
          parsed_result?: Json | null;
          action?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
