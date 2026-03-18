import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

// Create Supabase client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function checkDatabase() {
  try {
    console.log("\n=== CHECKING DATABASE ===\n");

    // Query database directly
    const { data: materials, error } = await supabaseAdmin
      .from("LectureMaterial")
      .select("*")
      .order("LectureId", { ascending: true })
      .limit(20);

    if (error) {
      console.error("❌ Database query error:", error.message);
      process.exit(1);
    }

    console.log(`✅ Found ${materials.length} materials in database:\n`);

    materials.forEach((m, i) => {
      console.log(`${i + 1}. LectureId: ${m.LectureId}`);
      console.log(`   Id: ${m.Id}`);
      console.log(`   Type: ${m.Type}`);
      console.log(
        `   URL: ${m.Url.substring(0, 120)}${m.Url.length > 120 ? "..." : ""}`,
      );

      if (m.Url.includes("supabase")) {
        console.log(`   ✅ Supabase URL`);
      } else if (
        m.Url.includes("commondatastorage") ||
        m.Url.includes("gtv-videos")
      ) {
        console.log(`   ❌ Old/dead URL`);
      }
      console.log("");
    });

    // Now check specific lecture
    console.log("\n=== CHECKING SPECIFIC LECTURE ===\n");

    const { data: lectures } = await supabaseAdmin
      .from("Lectures")
      .select("*")
      .eq("Title", "The Linux Directory Structure")
      .limit(1);

    if (lectures && lectures.length > 0) {
      const lecture = lectures[0];
      console.log(`✅ Found lecture: ${lecture.Title}`);
      console.log(`   Id: ${lecture.Id}\n`);

      // Get materials for this lecture
      const { data: lectureMaterials } = await supabaseAdmin
        .from("LectureMaterial")
        .select("*")
        .eq("LectureId", lecture.Id);

      console.log(
        `📊 Materials for this lecture: ${lectureMaterials?.length || 0}\n`,
      );

      if (lectureMaterials && lectureMaterials.length > 0) {
        lectureMaterials.forEach((m, i) => {
          console.log(`${i + 1}. Type: ${m.Type}`);
          console.log(`   URL: ${m.Url.substring(0, 120)}`);
        });
      } else {
        console.log("❌ No materials found for this lecture!");
      }
    } else {
      console.log("❌ Lecture not found!");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

checkDatabase();
