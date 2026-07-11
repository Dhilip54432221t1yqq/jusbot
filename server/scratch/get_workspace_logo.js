import '../src/config/env.js';
import { connectToDatabase, getDb } from '../src/utils/mongodb.js';

async function run() {
  await connectToDatabase();
  const db = getDb();
  const ws = await db.collection('workspaces').findOne({ _id: 'JB003' });
  console.log('Workspace:', ws);
  process.exit(0);
}

run();
