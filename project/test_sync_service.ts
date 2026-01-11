
import { PrintifySyncService } from './src/lib/printify/sync-service.ts';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual env load
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function testSync() {
    console.log('--- Testing Printify Sync Service ---');
    try {
        const result = await PrintifySyncService.syncProducts();
        console.log('Sync Result:', result);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testSync();
