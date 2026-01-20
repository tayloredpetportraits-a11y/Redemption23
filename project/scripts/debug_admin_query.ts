
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery() {
    console.log("Testing: .select('*, images(*)')");

    const { data, error } = await supabase
        .from('orders')
        .select('*, images:images!images_order_id_fkey(*)')
        .limit(5);

    if (error) {
        console.error("QUERY FAILED:", error);
    } else {
        console.log("QUERY SUCCESS!");
        console.log("Orders found:", data.length);
        if (data.length > 0) {
            console.log("First order images:", data[0].images);
        }
    }
}

testQuery();
