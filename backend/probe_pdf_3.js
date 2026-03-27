import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  const { PDFParse } = require('pdf-parse');
  console.log('PDFParse type:', typeof PDFParse);
  
  if (typeof PDFParse === 'function' || typeof PDFParse === 'object') {
     console.log('PDFParse is likely a class/constructor.');
     // Try to instantiate with empty data to see if it throws constructor error
     try {
       const p = new PDFParse({ data: Buffer.from('%PDF-1.4') });
       console.log('Instantiation successful');
       console.log('Has getText:', typeof p.getText === 'function');
     } catch (instError) {
       console.error('Instantiation failed:', instError.message);
     }
  }
} catch (e) {
  console.error('Probe failed:', e.message);
}
