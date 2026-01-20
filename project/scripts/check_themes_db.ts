
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkThemes() {
    const { data: themes, error } = await supabase.from('themes').select('*');
    if (error) {
        console.error('Error fetching themes:', error);
        return;
    }
    console.log(`Found ${themes.length} themes.`);
    themes.forEach(t => {
        console.log(`- ${t.name} (ID: ${t.id}) [Refs: ${t.reference_images?.length}] [Text: ${t.requires_text}]`);
    });

    if (themes.length < 2) {
        console.warn("WARNING: You need at least 2 themes (1 Primary + 1 Bonus) for the full 10-image flow!");
    }
}

checkThemes();
