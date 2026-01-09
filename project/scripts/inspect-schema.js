const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function inspectSchema() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, key);

    // Trick: Select one row and look at keys
    const { data, error } = await supabase.from('images').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Existing Columns in 'images':", Object.keys(data[0]));
    } else {
        // Since images might be empty, we might not get keys. 
        // We'll try to insert a dummy row to fail and see error, OR use a different method.
        // But let's try reading first.
        console.log("Images table might be empty. Trying insertion error check...");
        const { error: insertError } = await supabase.from('images').insert({ id: 'dummy', url: 'dummy', order_id: 'dummy' });
        if (insertError) {
            console.log("Insertion Error (reveals schema issues?):", insertError.message);
        }
    }
}

inspectSchema();
