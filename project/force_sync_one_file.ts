
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const TOKEN = process.env.PRINTIFY_API_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SHOP_ID || !TOKEN) {
    console.error("Missing Env Vars:", { SUPABASE_URL, SHOP_ID, hasToken: !!TOKEN, hasServiceKey: !!SUPABASE_SERVICE_KEY });
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    console.log("--- STARTING FORCE SYNC ---");

    // 1. Fetch from Printify
    console.log(`Fetching from Shop ${SHOP_ID}...`);
    const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json?limit=50`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!res.ok) {
        console.error("Printify API Error:", await res.text());
        return;
    }

    const json = await res.json();
    const products = json.data || [];
    console.log(`Found ${products.length} products in Printify.`);

    // 2. Insert into Supabase
    for (const p of products) {
        // Find default image
        const defaultImg = p.images?.find((img: any) => img.is_default) || p.images?.[0];
        console.log(`Processing: ${p.title} (ID: ${p.id})`);
        if (defaultImg) console.log(` - Found Image: ${defaultImg.src}`);

        const payload = {
            id: p.id,
            title: p.title,
            blueprint_id: p.blueprint_id,
            print_provider_id: p.print_provider_id,
            variants: p.variants.map((v: any) => ({ id: v.id, title: v.title })),
            is_active: p.visible,
            image_url: defaultImg ? defaultImg.src : null,
            last_synced_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('printify_products')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            console.error(`!!! UPSERT ERROR for ${p.title}:`, error);
        } else {
            console.log(`>>> Success: Upserted ${p.title}`);
        }
    }

    console.log("--- CHECKING DB ---");
    const { data, error: dbErr } = await supabase.from('printify_products').select('*');
    if (dbErr) console.error("DB Select Error:", dbErr);
    else {
        console.log(`DB now contains ${data?.length} products:`);
        data?.forEach(r => console.log(` - ${r.title} [${r.id}]`));
    }
}

run();
