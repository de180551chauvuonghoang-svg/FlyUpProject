const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";

async function checkUploads() {
  try {
    console.log("\n=== CHECKING COURSE DATA ===\n");
    const response = await fetch(
      `http://localhost:5000/api/courses/${courseId}`
    );
    const json = await response.json();
    const course = json.data;

    console.log(`📚 Course: ${course.Title}`);
    console.log(`📊 Sections: ${course.Sections.length}`);

    let totalLectures = 0;
    let videoCount = 0;
    let supabaseCount = 0;

    course.Sections.forEach((section, sIdx) => {
      console.log(`\n📌 Section ${sIdx + 1}: ${section.Title}`);

      section.Lectures?.forEach((lecture, lIdx) => {
        totalLectures++;
        if (lecture.VideoUrl) {
          videoCount++;
          const isSupabase = lecture.VideoUrl.includes("supabase");
          if (isSupabase) {
            supabaseCount++;
            console.log(`  ✅ Lecture ${lIdx + 1}: ${lecture.Title}`);
            console.log(`     🎬 Supabase URL: YES`);
          } else {
            console.log(`  ❌ Lecture ${lIdx + 1}: ${lecture.Title}`);
            console.log(
              `     🎬 OLD URL: ${lecture.VideoUrl.substring(0, 60)}...`,
            );
          }
        } else {
          console.log(`  ⚪ Lecture ${lIdx + 1}: ${lecture.Title}`);
          console.log(`     🎬 NO VIDEO`);
        }
      });
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total lectures: ${totalLectures}`);
    console.log(`Lectures with videos: ${videoCount}`);
    console.log(`Supabase URLs: ${supabaseCount}`);
    console.log(`Old/Dead URLs: ${videoCount - supabaseCount}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkUploads();
