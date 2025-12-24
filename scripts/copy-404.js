import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const indexHtmlPath = join(distDir, 'index.html');
const html404Path = join(distDir, '404.html');

try {
  // Read the built index.html
  const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
  
  // Write it as 404.html
  writeFileSync(html404Path, indexHtml, 'utf-8');
  
  console.log('✅ Successfully created 404.html from index.html');
} catch (error) {
  console.error('❌ Error creating 404.html:', error.message);
  process.exit(1);
}

