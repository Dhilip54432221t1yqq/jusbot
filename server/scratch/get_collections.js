import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

const collections = new Set();

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walkDir(fullPath);
            }
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Regex to find .from('collectionName') or .from("collectionName")
            const matches = content.match(/\.from\(['"]([^'"]+)['"]\)/g);
            if (matches) {
                for (const match of matches) {
                    const name = match.match(/\.from\(['"]([^'"]+)['"]\)/)[1];
                    collections.add(name);
                }
            }
        }
    }
}

walkDir(serverDir);
console.log('Found collections:', Array.from(collections).sort());
