import { initializeStorageBuckets } from "../src/services/storageService.js";

/**
 * Initialize Supabase Storage Buckets
 * Run: npm run init-storage
 */

console.log("🚀 Initializing Supabase Storage Buckets...\n");

initializeStorageBuckets()
  .then(() => {
    console.log("\n✅ Storage initialization completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Storage initialization failed:", error);
    process.exit(1);
  });
