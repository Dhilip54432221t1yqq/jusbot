import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
    const bucketName = 'workspace-assets';
    
    console.log(`Checking for bucket: ${bucketName}...`);
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }
    
    const exists = buckets.find(b => b.name === bucketName);
    
    if (exists) {
        console.log(`Bucket "${bucketName}" already exists.`);
    } else {
        console.log(`Bucket "${bucketName}" not found. Attempting to create...`);
        const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 1024 * 1024 * 5, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
        });
        
        if (error) {
            console.error('Failed to create bucket:', error);
            console.log('\nTIP: You might need to create the bucket manually in the Supabase Dashboard (Storage tab) with the name "workspace-assets" and set it to PUBLIC.');
        } else {
            console.log(`Bucket "${bucketName}" created successfully!`);
        }
    }
}

setupBucket();
