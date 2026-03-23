import dns from 'node:dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Force IPv4 for DNS resolution early to avoid connectivity issues with Supabase/Gmail
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (error) {
  console.warn('Note: dns.setDefaultResultOrder not supported or failed');
}

// 2. Load environment variables before any other logic
const envPath = join(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  if (result.error.code !== 'ENOENT') {
    console.error('❌ DOTENV LOAD ERROR:', result.error);
  } else {
    console.warn('⚠️ .env file not found at', envPath);
  }
} else if (process.env.DEBUG_DOTENV) {
  console.log('✅ DOTENV LOADED VARS:', Object.keys(result.parsed));
}

export default true;
