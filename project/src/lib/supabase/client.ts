import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  pet_name: string | null;
  product_type: string | null;
  status: 'pending' | 'ready' | 'failed';
  payment_status: 'unpaid' | 'paid';
  social_consent: boolean;
  social_handle: string | null;
  marketing_consent: boolean;
  consent_date: string | null;
  rating: number | null;
  review_text: string | null;
  revision_status: 'none' | 'requested' | 'in_progress' | 'completed';
  revision_notes: string | null;
  order_number: string | null;
  access_token: string | null;
  selected_image_id: string | null;
  selected_print_product: string | null;
  customer_notes: string | null;
  bonus_unlocked: boolean;
  bonus_payment_status: 'unpaid' | 'paid' | 'refunded';
  stripe_session_id: string | null;
  viewed_at: string | null;
  downloaded_count: number;
  bonus_conversion: boolean;
  upsell_conversion: boolean;
  share_count: number;
  created_at: string;
};

export type Image = {
  id: string;
  order_id: string;
  url: string;
  storage_path: string;
  type: 'primary' | 'upsell';
  is_selected: boolean;
  is_bonus: boolean;
  watermarked_url: string | null;
  theme_name: string | null;
  display_order: number;
  created_at: string;
};
