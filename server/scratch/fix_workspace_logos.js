import '../src/config/env.js';
import { connectToDatabase, getDb } from '../src/utils/mongodb.js';

async function run() {
  await connectToDatabase();
  const db = getDb();
  
  const workspaces = await db.collection('workspaces').find({
    logo_url: { $regex: 'workspace-assets' }
  }).toArray();
  
  console.log(`Found ${workspaces.length} workspaces with old bucket URLs.`);
  
  for (const ws of workspaces) {
    const fixedUrl = ws.logo_url.replace('workspace-assets.s3', 'jusbot-workspace-assets.s3');
    console.log(`Fixing URL for ${ws._id}: ${ws.logo_url} -> ${fixedUrl}`);
    await db.collection('workspaces').updateOne(
      { _id: ws._id },
      { $set: { logo_url: fixedUrl } }
    );
  }
  
  console.log('Update completed!');
  process.exit(0);
}

run();
