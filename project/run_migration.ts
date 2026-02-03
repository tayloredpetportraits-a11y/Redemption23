import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    const sql = fs.readFileSync(path.join(__dirname, 'create_product_configs.sql'), 'utf-8');

    console.log('Running migration SQL...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // Try running via REST API instead
        console.log('Trying alternative method...\n');

        // Split into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));

        for (const statement of statements) {
            if (!statement) continue;
            console.log('Executing:', statement.substring(0, 100) + '...');

            const { error: execError } = await supabase.rpc('exec', { query: statement });
            if (execError) {
                console.error('Error:', execError);
            }
        }
    } else {
        console.log('Migration successful!');
    }

    // Verify the table was created
    console.log('\nVerifying table...');
    const { data: products, error: selectError } = await supabase
        .from('printify_product_configs')
        .select('*');

    if (selectError) {
        console.error('Error fetching products:', selectError);
    } else {
        console.log(`Found ${products?.length || 0} products in table`);
        console.log('Products:', products);
    }
}

runMigration().then(() => process.exit());
