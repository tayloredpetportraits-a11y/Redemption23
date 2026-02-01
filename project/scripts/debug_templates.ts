
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTemplates() {
    console.log('Fetching product_templates...');
    const { data, error } = await supabase
        .from('product_templates')
        .select('*');

    if (error) {
        console.error('Error fetching templates:', error);
        return;
    }

    console.log(`Found ${data.length} templates:`);
    data.forEach(t => {
        console.log(`\nID: ${t.id}`);
        console.log(`Name: ${t.name}`);
        console.log(`Product Type: ${t.product_type}`);
        console.log(`Overlay URL: ${t.overlay_url}`);
        console.log(`Mask URL: ${t.mask_url}`);
        console.log(`Warp Config:`, JSON.stringify(t.warp_config));
    });
}

checkTemplates();
