
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkThemes() {
    console.log('🔍 Checking Themes...');
    const { data: themes, error } = await supabase.from('themes').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(`Found ${themes.length} themes:`);
    themes.forEach(t => console.log(`- [${t.id}] ${t.name} (Trigger: ${t.trigger_word})`));
}

checkThemes();
