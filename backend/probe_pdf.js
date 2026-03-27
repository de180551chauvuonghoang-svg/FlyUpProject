import pdf from 'pdf-parse';
import fs from 'fs';

console.log('pdf-parse type:', typeof pdf);
console.log('pdf-parse keys:', Object.keys(pdf || {}));

try {
  console.log('Attempting to call pdf as function...');
  // This will fail if it's not a function, but we just want to see the type
} catch (e) {
  console.error('Call failed:', e.message);
}
