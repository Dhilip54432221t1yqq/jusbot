import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Validate required environment variables at startup
const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'FB_APP_ID',
  'FB_APP_SECRET',
  'FB_REDIRECT_URI',
  'WEBHOOK_VERIFY_TOKEN'
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`[Env] ❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('[Env] Check your server/.env file.');
}
