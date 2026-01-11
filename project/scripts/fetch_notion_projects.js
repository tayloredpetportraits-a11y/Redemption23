const fs = require('fs');
const path = require('path');

async function main() {
    const envPath = path.join(process.cwd(), '.env.local');
    let apiKey = process.env.NOTION_API_KEY;
    if (!apiKey && fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/NOTION_API_KEY=(.+)/);
        if (match) apiKey = match[1].trim();
    }

    if (!apiKey) {
        console.error('No API Key');
        return;
    }

    const dbId = '2e1d1f07-0b6b-80f4-9c5b-da9dab1eddd6';
    const url = `https://api.notion.com/v1/databases/${dbId}/query`;

    console.log(`Fetching ${url} ...`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Notion-Version': '2022-06-28', // Use recent version
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page_size: 20
            })
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error('Fetch Error:', res.status, txt);
            return;
        }

        const data = await res.json();
        console.log(`Found ${data.results.length} items.\n`);
        console.log('--- Project Tasks ---');

        data.results.forEach(page => {
            const props = page.properties;
            // Try to find Name
            const nameKey = Object.keys(props).find(k => props[k].type === 'title');
            const title = nameKey ? props[nameKey].title[0]?.plain_text : 'Untitled';

            // Try to find Status
            const statusKey = Object.keys(props).find(k => props[k].type === 'status' || props[k].type === 'select');
            let status = '';
            if (statusKey) {
                const p = props[statusKey];
                if (p.type === 'status') status = `[${p.status?.name}]`;
                if (p.type === 'select') status = `[${p.select?.name}]`;
            }

            console.log(`• ${title} ${status}`);
        });

    } catch (e) {
        console.error('Script Error:', e);
    }
}

main();
