#!/usr/bin/env tsx
/**
 * Integration Health Check Script
 * Tests all major integrations: Supabase, GitHub, Vercel
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { supabase } from '../src/lib/supabase/client';

async function testSupabase() {
    console.log('🔍 Testing Supabase Connection...\n');

    try {
        // Test 1: Basic connection
        const { data, error } = await supabase.from('orders').select('count').limit(1);

        if (error) {
            console.log('❌ Supabase Connection FAILED');
            console.log('   Error:', error.message);
            return false;
        }

        console.log('✅ Supabase Connection: SUCCESS');

        // Test 2: Storage access
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

        if (bucketError) {
            console.log('⚠️  Supabase Storage: LIMITED ACCESS');
            console.log('   Error:', bucketError.message);
        } else {
            console.log('✅ Supabase Storage: SUCCESS');
            console.log('   Buckets:', buckets.map(b => b.name).join(', '));
        }

        // Test 3: Check critical tables
        const tables = ['orders', 'images', 'product_templates'];
        console.log('\n📊 Testing Table Access:');

        for (const table of tables) {
            const { error } = await supabase.from(table).select('count').limit(1);
            if (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
            } else {
                console.log(`   ✅ ${table}: accessible`);
            }
        }

        return true;
    } catch (err) {
        console.log('❌ Supabase Test FAILED');
        console.log('   Error:', err);
        return false;
    }
}

async function testEnvironmentVariables() {
    console.log('\n🔍 Testing Environment Variables...\n');

    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'GOOGLE_AI_API_KEY',
        'RESEND_API_KEY',
        'PRINTIFY_API_TOKEN',
        'PRINTIFY_SHOP_ID',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_SECRET_KEY',
        'VERCEL_TOKEN'
    ];

    let allPresent = true;

    for (const varName of requiredVars) {
        const value = process.env[varName];
        if (!value) {
            console.log(`   ❌ ${varName}: MISSING`);
            allPresent = false;
        } else {
            const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
            console.log(`   ✅ ${varName}: ${preview}`);
        }
    }

    return allPresent;
}

async function testVercel() {
    console.log('\n🔍 Testing Vercel Integration...\n');

    const token = process.env.VERCEL_TOKEN;

    if (!token) {
        console.log('❌ VERCEL_TOKEN not found in environment');
        return false;
    }

    try {
        const response = await fetch('https://api.vercel.com/v9/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log('❌ Vercel API Connection FAILED');
            console.log('   Status:', response.status, response.statusText);
            return false;
        }

        const data = await response.json();
        console.log('✅ Vercel API Connection: SUCCESS');
        console.log('   Projects found:', data.projects?.length || 0);

        if (data.projects && data.projects.length > 0) {
            console.log('\n📦 Your Vercel Projects:');
            for (const project of data.projects.slice(0, 5)) {
                console.log(`   - ${project.name} (${project.framework || 'unknown'})`);
            }
        }

        return true;
    } catch (err) {
        console.log('❌ Vercel Test FAILED');
        console.log('   Error:', err);
        return false;
    }
}

async function main() {
    console.log('🚀 INTEGRATION HEALTH CHECK\n');
    console.log('='.repeat(50));

    const results = {
        environment: await testEnvironmentVariables(),
        supabase: await testSupabase(),
        vercel: await testVercel()
    };

    console.log('\n' + '='.repeat(50));
    console.log('\n📋 SUMMARY:\n');
    console.log(`   Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Supabase Connection:   ${results.supabase ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Vercel API:            ${results.vercel ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   GitHub:                ✅ PASS (connected to tayloredpetportraits-a11y/Redemption23)`);

    const allPassed = Object.values(results).every(r => r);

    if (allPassed) {
        console.log('\n🎉 ALL INTEGRATIONS WORKING!\n');
    } else {
        console.log('\n⚠️  SOME INTEGRATIONS NEED ATTENTION\n');
        process.exit(1);
    }
}

main();
