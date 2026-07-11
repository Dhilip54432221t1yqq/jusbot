import '../config/env.js';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('[MongoDB] ❌ Missing MONGODB_URI in environment variables.');
}

const client = new MongoClient(uri || 'mongodb://localhost:27017');
let dbInstance = null;

export async function connectToDatabase() {
  if (dbInstance) return dbInstance;
  try {
    console.log('[MongoDB] Connecting to database...');
    await client.connect();
    // Use the database name from the connection string or default to 'reflx'
    const dbName = uri && uri.includes('mongodb.net/') 
      ? uri.split('mongodb.net/')[1].split('?')[0] 
      : 'reflx';
    dbInstance = client.db(dbName || 'reflx');
    console.log(`[MongoDB] Connected to database: "${dbInstance.databaseName}"`);
    return dbInstance;
  } catch (error) {
    console.error('[MongoDB] ❌ Connection failed:', error.message);
    throw error;
  }
}

export function getDb() {
  if (!dbInstance) {
    throw new Error('[MongoDB] Database not initialized. Call connectToDatabase() first.');
  }
  return dbInstance;
}

export default { connectToDatabase, getDb };
