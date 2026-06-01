import fs from 'fs';
import { transformSync } from 'esbuild';

try {
  const code = fs.readFileSync('./src/pages/InteractiveDesign.jsx', 'utf-8');
  const result = transformSync(code, { loader: 'jsx', jsx: 'automatic' });
  console.log('✅ esbuild transpiled successfully. No syntax errors.');
} catch (e) {
  console.error('❌ esbuild error:', e.message);
}
