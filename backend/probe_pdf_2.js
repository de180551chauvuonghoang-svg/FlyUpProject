import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  const pdf = require('pdf-parse');
  console.log('pdf-parse type:', typeof pdf);
  console.log('pdf-parse keys:', Object.keys(pdf || {}));
} catch (e) {
  console.error('Require failed:', e.message);
}
