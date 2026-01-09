const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Testing Supabase Connection...");
    console.log("URL:", url);
    console.log("Key (first 10 chars):", key ? key.substring(0, 10) + '...' : 'MISSING');

    if (!url || !key) {
        console.error("Missing credentials in .env.local");
        return;
    }

    const supabase = createClient(url, key);

    try {
        const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("CONNECTION FAILED:", error.message);
            console.error("Details:", error); // Inspect full error object
        } else {
            console.log("CONNECTION SUCCESSFUL!");
            console.log("Orders count:", data /* count is in 'count' property for head request usually, but data is null for head? Wait. */);
            // actually head:true returns null data usually but verify header. 
            // accurate way:
        }

        // Try standard select to be sure
        const { data: userData, error: userError } = await supabase.from('orders').select('*').limit(1);
        if (userError) {
            console.error("SELECT FAILED:", userError.message);
        } else {
            console.log("Select worked. Rows returned:", userData.length);
        }

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
}

testConnection();
