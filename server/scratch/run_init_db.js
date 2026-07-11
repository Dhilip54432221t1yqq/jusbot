import '../src/config/env.js';
import { connectToDatabase } from '../src/utils/mongodb.js';
import { initializeDatabase } from '../src/utils/initDb.js';

async function main() {
  try {
    const db = await connectToDatabase();
    await initializeDatabase();
    console.log('\n🎉 Successfully ran database verification and optimization!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database verification and optimization failed:', error);
    process.exit(1);
  }
}

main();
