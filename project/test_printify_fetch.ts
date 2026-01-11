
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkPrintify() {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const token = process.env.PRINTIFY_API_TOKEN;

    if (!shopId || !token) {
        console.error("Missing credentials");
        return;
    }

    console.log(`Checking Shop: ${shopId}`);
    try {
        const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Printify API Response:");
        if (data.data) {
            data.data.forEach((p: any) => {
                console.log(`- [${p.id}] ${p.title} (Visible: ${p.visible})`);
            });
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

checkPrintify();
