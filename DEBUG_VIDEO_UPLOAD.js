#!/usr/bin/env node
/**
 * Debug Script: Test Video Upload
 * Kiểm tra chính xác cái gì được gửi đi khi upload video
 */

const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

// Test configuration
const API_URL = 'http://localhost:5000/api';
const LECTURE_ID = '446d55f9-eb87-4019-85d6-02ed4f22fb9b'; // Dùng lecture ID từ database
const TEST_FILE = 'test-video.mp4';
const TEST_TOKEN = 'test-token'; // Sẽ cần token thực

console.log('\n🔍 VIDEO UPLOAD DEBUG TEST\n');
console.log('═'.repeat(60));

console.log('\n1️⃣  Tạo test video...');

// Tạo file video giả (100MB không khó, ta làm 1MB test)
const testVideoPath = TEST_FILE;
if (!fs.existsSync(testVideoPath)) {
  const buffer = Buffer.alloc(1024 * 1024); // 1MB
  fs.writeFileSync(testVideoPath, buffer);
  console.log(`   ✅ Tạo test video: ${testVideoPath} (1MB)`);
} else {
  console.log(`   ✅ Dùng video hiện có: ${testVideoPath}`);
}

console.log('\n2️⃣  Tạo FormData và append fields...');

const form = new FormData();

// Append file
const fileStream = fs.createReadStream(testVideoPath);
form.append('file', fileStream, {
  filename: 'test-video.mp4',
  contentType: 'video/mp4',
});

// Append lectureId (ĐÂY LÀ QUAN TRỌNG - PHẢI CÓ)
form.append('lectureId', LECTURE_ID);

console.log(`   ✓ File appended: test-video.mp4`);
console.log(`   ✓ lectureId appended: ${LECTURE_ID}`);
console.log(`   ✓ FormData fields:`);

const entries = form.getHeaders();
console.log(`      Headers:`, entries);

console.log('\n3️⃣  Chuẩn bị POST request...');

const uploadUrl = `${API_URL}/upload/video`;
console.log(`   URL: ${uploadUrl}`);
console.log(`   Method: POST`);
console.log(`   Headers:`);
console.log(`      Content-Type: ${form.getHeaders()['content-type']}`);
console.log(`      Authorization: Bearer ${TEST_TOKEN}`);

console.log('\n4️⃣  CẦU HÌNH ĐỂ MANUAL TEST:\n');

console.log(`📌 Copy lệnh curl này vào terminal:\n`);

console.log(`curl -X POST http://localhost:5000/api/upload/video \\`);
console.log(`  -H "Authorization: Bearer YOUR_REAL_TOKEN" \\`);
console.log(`  -F "file=@test-video.mp4" \\`);
console.log(`  -F "lectureId=446d55f9-eb87-4019-85d6-02ed4f22fb9b"\n`);

console.log('\n5️⃣  BACKEND LOGS ĐỂ KIỂM TRA:\n');

console.log('Khi upload, backend sẽ in ra:');
console.log(`   [UPLOAD_VIDEO_START] file: {...}, lectureId: "446d55f9..."`);
console.log(`   [UPLOAD_VIDEO] lectureId received: { value: "446d55f9...", type: "string", isEmpty: false }`);
console.log(`   [UPLOAD_VIDEO] Uploading to Supabase...`);
console.log(`   [UPLOAD_VIDEO] Supabase response: { url: "https://...", path: "..." }`);
console.log(`   [UPLOAD_VIDEO] Checking lecture: 446d55f9...`);
console.log(`   [UPLOAD_VIDEO] Lecture found, deleting old videos...`);
console.log(`   [UPLOAD_VIDEO] Creating new material record...`);
console.log(`   [UPLOAD_VIDEO] Material created: { LectureId: "...", Id: 1, Type: "video" }`);
console.log(`   [UPLOAD_VIDEO_END] Success\n`);

console.log('\n6️⃣  CÀI ĐẶTCHECK LIST:\n');

const checks = [
  { item: 'Backend running?', cmd: 'curl http://localhost:5000/api/health' },
  { item: 'Token valid?', cmd: 'Ask for token from auth login' },
  { item: 'lectureId tồn tại?', cmd: 'SELECT * FROM "Lectures" WHERE "Id" = \'446d55f9-eb87-4019-85d6-02ed4f22fb9b\'' },
  { item: 'File format?', cmd: 'Must be video/mp4, video/mpeg, video/quicktime, video/x-msvideo' },
  { item: 'File size?', cmd: 'Must be < 100MB' },
];

checks.forEach((check, i) => {
  console.log(`   ${i + 1}. ${check.item}`);
  console.log(`      → ${check.cmd}\n`);
});

console.log('═'.repeat(60));
console.log('\n📊 EXPECTED RESULT:\n');

console.log('✅ If everything works:');
console.log('   1. Response: { "success": true, "message": "Video uploaded successfully", ... }');
console.log('   2. Supabase → LectureMaterial table → New row with Type="video"');
console.log('   3. Learn page → Video appears in player\n');

console.log('❌ If lectureId missing:');
console.log('   1. Response: { "success": true, ... } (được gửi nhưng không lưu DB)');
console.log('   2. Backend logs: [UPLOAD_VIDEO] ⚠️ WARNING: lectureId NOT provided!');
console.log('   3. Supabase → KHÔNG có row mới');
console.log('   4. Learn page → KHÔNG hiện video\n');

console.log('❌ If lectureId wrong:');
console.log('   1. Response: { "error": "Lecture not found" }');
console.log('   2. HTTP Status: 404\n');

console.log('\n═'.repeat(60));
console.log('\n🎯 NEXT STEPS:\n');
console.log('1. Chạy: npm run dev (backend)');
console.log('2. Check backend logs when uploading');
console.log('3. Look for: [UPLOAD_VIDEO] lectureId received: {...}');
console.log('4. If missing, fix frontend to pass lectureId');
console.log('5. If present but not saving, check database');
console.log('6. Report findings to debug further\n');

console.log('═'.repeat(60) + '\n');
