import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all mockup templates
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('product_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch templates' },
                { status: 500 }
            );
        }

        return NextResponse.json({ templates: data || [] });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new mockup template
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, overlay_url, aspect_ratio, purchase_link, is_active } = body;

        // Validate required fields
        if (!name || !overlay_url || !aspect_ratio || !purchase_link) {
            return NextResponse.json(
                { error: 'Missing required fields: name, overlay_url, aspect_ratio, purchase_link' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('product_templates')
            .insert([
                {
                    name,
                    overlay_url,
                    aspect_ratio,
                    purchase_link,
                    is_active: is_active ?? true,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to create template' },
                { status: 500 }
            );
        }

        return NextResponse.json({ template: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
