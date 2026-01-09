
import { createAdminClient } from '@/lib/supabase/server';

export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'rejected';

export interface SocialPost {
    id: string;
    order_id: string;
    image_id: string;
    platform: string;
    caption: string;
    hashtags: string[];
    status: SocialPostStatus;
    scheduled_for: string | null;
    published_at: string | null;
    created_at: string;
}

export async function createSocialPost(data: {
    order_id: string;
    image_id: string;
    caption: string;
    hashtags: string[];
    platform?: string;
}) {
    const supabase = createAdminClient();

    // Check if one already exists for this image?
    // Maybe we allow multiple drafts. Let's just insert.

    const { data: post, error } = await supabase
        .from('social_posts')
        .insert({
            order_id: data.order_id,
            image_id: data.image_id,
            caption: data.caption,
            hashtags: data.hashtags,
            platform: data.platform || 'instagram',
            status: 'draft'
        })
        .select()
        .single();

    if (error) throw error;
    return post;
}

export async function getSocialPosts(status: SocialPostStatus | 'all' = 'draft') {
    const supabase = createAdminClient();

    let query = supabase
        .from('social_posts')
        .select(`
            *,
            images (
                url,
                storage_path
            ),
            orders (
                customer_name,
                pet_name
            )
        `)
        .order('created_at', { ascending: false });

    if (status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function updateSocialPost(id: string, updates: Partial<SocialPost>) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('social_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
