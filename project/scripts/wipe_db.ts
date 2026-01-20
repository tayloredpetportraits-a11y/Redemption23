
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function wipeDatabase() {
    console.log('🗑️  Wiping Database (Orders & Images)...');

    // Delete Images first due to potential FK constraints (though usually cascade takes care of it, safe to be explicit)
    const { error: imgError } = await supabase
        .from('images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Valid UUID nonsense to match all

    if (imgError) console.error('Error deleting images:', imgError);
    else console.log('✅ Images cleared.');

    // Delete Orders
    const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (orderError) console.error('Error deleting orders:', orderError);
    else console.log('✅ Orders cleared.');

    console.log('✨ Clean Slate!');
}

wipeDatabase();
