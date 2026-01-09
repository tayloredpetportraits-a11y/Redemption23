
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    const { data, error } = await supabase
        .from('orders')
        .select('social_consent, social_handle')
        .eq('id', '59521dad-762b-4481-bb76-53cdbe9aecf7')
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return;
    }

    console.log('Verification Result:');
    console.log('social_consent:', data.social_consent);
    console.log('social_handle:', data.social_handle);

    if (data.social_consent === true && data.social_handle === '@tester_pet') {
        console.log('SUCCESS: Data persisted correctly.');
    } else {
        console.log('FAILURE: Data mismatch.');
    }
}

verify();
