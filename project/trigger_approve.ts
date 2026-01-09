const SERVER_URL = 'http://localhost:3000';
const imageId = '6a9d80e7-990a-4019-bfa8-b43372b51a9a';

async function trigger() {
    console.log(`Triggering approval for ${imageId}...`);
    try {
        const response = await fetch(`${SERVER_URL}/api/admin/images/${imageId}/approve`, {
            method: 'POST'
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}

trigger();
