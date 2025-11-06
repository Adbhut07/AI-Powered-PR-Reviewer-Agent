#!/usr/bin/env node

// Environment Variable Checker
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking Environment Variables...\n');

try {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const required = [
    'GITHUB_TOKEN',
    'WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'DATABASE_URL'
  ];
  
  const missing = [];
  const configured = [];
  
  required.forEach(key => {
    const regex = new RegExp(`${key}=(.+)`);
    const match = envContent.match(regex);
    
    if (!match || match[1].trim() === '' || match[1].includes('your_') || match[1].includes('password@localhost')) {
      missing.push(key);
      console.log(`❌ ${key}: Not configured`);
    } else {
      configured.push(key);
      console.log(`✅ ${key}: Configured`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (missing.length === 0) {
    console.log('\n✅ All environment variables are configured!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:push');
    console.log('2. Run: npm run dev');
    console.log('3. Set up GitHub webhook (see SETUP.md)');
  } else {
    console.log(`\n⚠️  Missing ${missing.length} configuration(s)`);
    console.log('\nPlease configure these variables in .env:');
    missing.forEach(key => console.log(`  - ${key}`));
    console.log('\nSee SETUP.md for detailed instructions.');
  }
} catch (error) {
  console.error('❌ Error: .env file not found');
  console.log('\nPlease create a .env file:');
  console.log('  cp .env.example .env');
  console.log('\nThen fill in your credentials.');
}

console.log('\n' + '='.repeat(50) + '\n');
