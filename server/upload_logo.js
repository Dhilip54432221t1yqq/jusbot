import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://cjlngemrulrgmlhixjbs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FmjpCd8p-PCgYNAbybefPw_EPUsbMuE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGO_SOURCE = 'C:\\Users\\Hxtreme\\.gemini\\antigravity\\brain\\9bfb7457-2299-46ff-9329-cb3468245ab9\\media__1777530964426.jpg';
const BUCKET = 'brand-assets';
const FILE_NAME = 'jusbot_logo.jpg';

async function uploadLogo() {
    // Read the image
    const fileBuffer = fs.readFileSync(LOGO_SOURCE);
    
    console.log(`Read file: ${fileBuffer.length} bytes`);

    // Try to create the bucket (ignore if already exists)
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('Bucket creation error:', bucketError.message);
    } else {
        console.log('Bucket ready:', BUCKET);
    }

    // Upload the file
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(FILE_NAME, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
        });

    if (error) {
        console.error('Upload error:', error.message);
        process.exit(1);
    }

    console.log('Upload success:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(FILE_NAME);

    console.log('\n✅ PUBLIC URL:');
    console.log(urlData.publicUrl);
}

uploadLogo();
