import { createAdminClient } from '../src/lib/supabase/server';

async function checkOrder() {
    const supabase = createAdminClient();
    const orderId = '787cd138-c8fc-4271-895d-100420a30807';

    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId);

    console.log(`✅ Order has ${images?.length || 0} images`);
    console.log(`📋 Magic Link: http://localhost:3000/portal/${orderId}`);
}

checkOrder();
