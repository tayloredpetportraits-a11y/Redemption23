
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkThemes() {
    console.log('🔍 Checking for "themes" table...');
    const { data, error } = await supabase.from('themes').select('*').limit(1);

    if (error) {
        console.error('❌ Table "themes" access failed (likely does not exist):', error.message);
    } else {
        console.log('✅ Table "themes" exists!');
        console.log('Sample:', data);
    }
}

checkThemes();
