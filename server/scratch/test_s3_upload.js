import '../src/config/env.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const bucket = process.env.AWS_S3_BUCKET_NAME || 'jusbot-workspace-assets';
const region = process.env.AWS_REGION || 'ap-south-1';

console.log('Using Bucket:', bucket);
console.log('Using Region:', region);

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function runTest() {
  try {
    const uploadParams = {
      Bucket: bucket,
      Key: 'test-upload.txt',
      Body: 'Hello Reflx AWS S3 connection test!',
      ContentType: 'text/plain',
    };

    console.log('Sending PutObjectCommand...');
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('Upload success! S3 Result:', result);
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/test-upload.txt`;
    console.log('Public URL:', publicUrl);
  } catch (err) {
    console.error('S3 Connection/Upload Error:', err);
  }
}

runTest();
