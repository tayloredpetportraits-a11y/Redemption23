
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// import { generateImagesForOrder } from '../src/lib/ai/generation';

// Load env vars
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Env Vars. Make sure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const args = process.argv.slice(2);
    const isPaid = args.includes('--paid');

    console.log("Creating Manual Test Order...");

    // 1. Create Order
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            customer_name: 'Testy McTesterson',
            customer_email: 'test@example.com',
            pet_name: 'Simulated Dog',
            pet_breed: 'Golden Retriever',
            pet_details: 'Manual simulation test',
            status: 'pending', // 'pending' = 'Review Needed' in Admin Dashboard logic if checked there
            payment_status: isPaid ? 'paid' : 'unpaid',
            product_type: 'Digital Only'
        })
        .select()
        .single();

    if (error) {
        console.error("Order creation failed:", error);
        process.exit(1);
    }

    console.log(`Order Created: ${order.id}`);

    // 2. Insert Dummy Mockups
    const mockups = [
        'https://placehold.co/600x600/png?text=Mockup+1',
        'https://placehold.co/600x600/png?text=Mockup+2',
        'https://placehold.co/600x600/png?text=Mockup+3',
        'https://placehold.co/600x600/png?text=Mockup+4'
    ];

    for (let i = 0; i < mockups.length; i++) {
        await supabase.from('images').insert({
            order_id: order.id,
            url: mockups[i],
            type: 'mockup',
            status: 'pending_review',
            display_order: i
        });
    }

    console.log("Mockups inserted.");

    // 3. Output Portal URL
    const portalUrl = `http://localhost:3000/portal/${order.id}`;
    // Or assuming the route structure:
    // The user codebase suggests /portal/[id] or /customer/gallery/[id]?
    // Admin Dashboard shows: /portal/${order.id}
    console.log(`\nUNKNOWN PORTAL URL: ${portalUrl}`);
    console.log(`\nClick to test: ${portalUrl}?payment=success`);
    // Adding payment=success mimics the 'Paid' flow often needed for full unlock
}

main().catch(console.error);
