
import { createAdminClient } from '../src/lib/supabase/server';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupMockupsBucket() {
    console.log('🏗️  Setting up "mockups" bucket...');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createAdminClient();
    const BUCKET_NAME = 'mockups';

    // 1. Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Error listing buckets:', listError.message);
        return;
    }

    const existingBucket = buckets.find(b => b.name === BUCKET_NAME);

    if (existingBucket) {
        console.log(`✅ Bucket "${BUCKET_NAME}" already exists.`);
        // Ensure it is public
        if (!existingBucket.public) {
            console.log('⚠️  Bucket exists but is NOT public. Updating...');
            const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
                public: true
            });
            if (updateError) console.error('❌ Failed to update bucket to public:', updateError.message);
            else console.log('✅ Bucket updated to Public.');
        }
    } else {
        console.log(`⚠️  Bucket "${BUCKET_NAME}" not found. Creating...`);
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });

        if (createError) {
            console.error('❌ Failed to create bucket:', createError.message);
            return;
        }
        console.log('✅ Bucket created successfully!');
    }

    console.log('\n🔐 RLS POLICY INSTRUCTIONS:');
    console.log('You must run the following SQL in the Supabase Dashboard SQL Editor to ensure correct access:');
    console.log('---------------------------------------------------------------------------------------');
    console.log(`
-- 1. Enable Public Read Access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = '${BUCKET_NAME}' );

-- 2. Enable Admin Upload Access
CREATE POLICY "Admin Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = '${BUCKET_NAME}' );

-- 3. Enable Admin Update/Delete (Optional but recommended)
CREATE POLICY "Admin Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id = '${BUCKET_NAME}' );

CREATE POLICY "Admin Delete" 
ON storage.objects FOR DELETE
USING ( bucket_id = '${BUCKET_NAME}' );
    `);
    console.log('---------------------------------------------------------------------------------------');
}

setupMockupsBucket();
