const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) console.error(error);
    else console.log(JSON.stringify(order, null, 2));

    const { data: images } = await supabase.from('images').select('status, is_bonus').eq('order_id', order.id);
    console.log("Images:", images);
}
main();
