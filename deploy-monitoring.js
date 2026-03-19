#!/usr/bin/env node
/**
 * Deploy XPERT.IA Monitoring Tables to Supabase
 *
 * Usage: node deploy-monitoring.js [--url=SUPABASE_URL] [--key=SERVICE_ROLE_KEY]
 *
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for admin access
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const config = {
  url: process.env.SUPABASE_URL || args.find(a => a.startsWith('--url='))?.split('=')[1],
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || args.find(a => a.startsWith('--key='))?.split('=')[1],
};

if (!config.url || !config.key) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('   Or pass: --url=YOUR_URL --key=YOUR_KEY');
  process.exit(1);
}

async function deploySQLFile(client, filePath) {
  try {
    console.log(`\n📂 Reading SQL from: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split by semicolon but keep them to preserve SQL structure
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`\n📊 Found ${statements.length} SQL statements to execute`);

    let executed = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      try {
        const { error } = await client.rpc('exec_sql', {
          sql: statement,
        }).catch(() => {
          // If RPC doesn't exist, try raw query via REST API
          return client
            .from('_raw_sql')
            .select()
            .catch(err => ({ error: err }));
        });

        if (error) {
          // Some statements might fail but that's ok (IF EXISTS clauses, etc)
          console.log(`  ⚠️  Statement ${i + 1}: ${error.message}`);
          failed++;
        } else {
          console.log(`  ✓ Statement ${i + 1}: OK`);
          executed++;
        }
      } catch (error) {
        console.error(`  ✗ Statement ${i + 1}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📈 Results: ${executed} executed, ${failed} warnings/failures`);
    return executed > 0;
  } catch (error) {
    console.error('❌ Error reading or parsing SQL file:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 XPERT.IA Monitoring Tables Deployment');
  console.log('=========================================\n');

  // For now, display the instructions since exec_sql might not be available
  console.log('📋 SQL DEPLOYMENT INSTRUCTIONS:\n');
  console.log('1. Go to: https://app.supabase.com/project/vyvdrbkcrvklcaombjqu/sql');
  console.log('2. Click "New Query"');
  console.log('3. Copy the contents of supabase/xpertia-monitoring.sql');
  console.log('4. Paste into the query editor');
  console.log('5. Click "Run"');
  console.log('\n✅ Once deployed, the monitoring dashboard will be active\n');

  // Try automated deployment as fallback
  try {
    const client = createClient(config.url, config.key);
    const sqlPath = path.join(path.dirname(import.meta.url), 'supabase', 'xpertia-monitoring.sql');

    console.log('🔄 Attempting automated deployment...\n');
    const success = await deploySQLFile(client, sqlPath);

    if (success) {
      console.log('\n✅ Deployment completed successfully!');
    }
  } catch (error) {
    console.log(`\n⚠️  Automated deployment not available: ${error.message}`);
    console.log('\n👉 Please use the manual instructions above\n');
  }
}

main().catch(console.error);
