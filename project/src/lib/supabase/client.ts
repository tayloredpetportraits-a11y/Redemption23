import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
export const createClient = () => supabase;

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  pet_name: string | null;
  pet_image_url: string | null;
  pet_breed: string | null;
  pet_details: string | null;
  product_type: string | null;
  status: 'pending' | 'ready' | 'failed' | 'fulfilled' | 'revising' | 'archived' | 'processing_print';
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
  fulfillment_status: string | null;
  print_provider_order_id: string | null;
  share_count: number;
  shelter_dog_id?: string | null;
  created_at: string;
};

export type ShelterDog = {
  id: string;
  name: string;
  photo_url: string;
  adoption_url: string | null;
  story: string | null;
};

export type Image = {
  id: string;
  order_id: string;
  url: string;
  storage_path: string;
  type: 'primary' | 'upsell' | 'mockup' | 'mobile_wallpaper';
  is_selected: boolean;
  is_bonus: boolean;
  watermarked_url: string | null;
  theme_name: string | null;
  display_order: number;
  status: 'generated' | 'approved' | 'rejected'; // Updated: 'pending_review' → 'generated'
  template_id: string | null;
  prompt?: string; // Optional debug info
  created_at: string;
};

export type ProductTemplate = {
  id: string;
  name: string;
  overlay_url: string;
  aspect_ratio: string;
  purchase_link: string;
  is_active: boolean;
  created_at: string;
  price_id?: string;
  price?: number; // Price in cents
  mask_url?: string | null;
  warp_config?: {
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    bl: { x: number; y: number };
    br: { x: number; y: number };
    clip?: string;
  };
};
