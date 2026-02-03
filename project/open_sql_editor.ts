import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function executeViaBrowser() {
    console.log('🌐 Opening browser to execute SQL...\n');
    console.log('📋 SQL to execute:');
    console.log('='.repeat(80));

    const sql = fs.readFileSync('./create_product_configs.sql', 'utf-8');
    console.log(sql);
    console.log('='.repeat(80));

    // Get project ref
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

    console.log(`\n📍 Visit: ${sqlEditorUrl}`);
    console.log('\n✅ I\'ll open this for you...');

    // Open the URL
    const { execSync } = require('child_process');
    execSync(`open "${sqlEditorUrl}"`);

    console.log('\n⏳ Please paste and run the SQL above in the browser.');
    console.log('After running, verify with: npx tsx verify_table.ts\n');
}

executeViaBrowser();
