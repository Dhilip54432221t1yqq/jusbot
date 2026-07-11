import '../src/config/env.js';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectToDatabase, getDb } from '../src/utils/mongodb.js';

const bucket = process.env.AWS_S3_BUCKET_NAME || 'jusbot-workspace-assets';
const region = process.env.AWS_REGION || 'ap-south-1';
const imagePath = 'C:\\Users\\Hxtreme\\.gemini\\antigravity\\brain\\24d9e4f7-de11-4f7c-ba23-ed07ffc67909\\browser\\test_logo.png';

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function run() {
  try {
    // 1. Read local file
    console.log('Reading local image file...');
    const fileBuffer = fs.readFileSync(imagePath);
    
    // 2. Upload to S3
    const s3Key = `logos/JB003-test-logo.png`;
    console.log(`Uploading to S3 bucket ${bucket} with key ${s3Key}...`);
    
    const uploadParams = {
      Bucket: bucket,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'image/png',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('S3 Upload successful!');

    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
    console.log('Generated S3 Public URL:', publicUrl);

    // 3. Connect to MongoDB and update workspace
    await connectToDatabase();
    const db = getDb();
    
    console.log('Updating workspace JB003 logo_url in MongoDB...');
    await db.collection('workspaces').updateOne(
      { _id: 'JB003' },
      { $set: { logo_url: publicUrl } }
    );
    console.log('Database update successful!');
    
    process.exit(0);
  } catch (error) {
    console.error('Execution failed:', error);
    process.exit(1);
  }
}

run();
