// Test script to check instructor courses API
import fetch from "node-fetch";

const API_URL = "http://localhost:5000/api";

async function testInstructorCourses() {
  try {
    // Replace with your actual access token from localStorage
    const token = "YOUR_ACCESS_TOKEN_HERE";

    console.log("Testing instructor courses API...");
    console.log("URL:", `${API_URL}/courses/instructor/courses?status=all`);

    const response = await fetch(
      `${API_URL}/courses/instructor/courses?status=all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    const data = await response.json();
    console.log("\nResponse data:", JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("\n✅ SUCCESS!");
      console.log("Total courses:", data.total);
      console.log("Courses count:", data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log("\nFirst course:");
        console.log("- ID:", data.data[0].id);
        console.log("- Title:", data.data[0].title);
        console.log("- Status:", data.data[0].status);
      }
    } else {
      console.log("\n❌ FAILED!");
      console.log("Error:", data.error);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Instructions
console.log("=".repeat(60));
console.log("INSTRUCTOR COURSES API TEST");
console.log("=".repeat(60));
console.log("\nTo run this test:");
console.log("1. Open browser and login to instructor account");
console.log("2. Open DevTools Console (F12)");
console.log('3. Run: localStorage.getItem("accessToken")');
console.log("4. Copy the token");
console.log("5. Replace YOUR_ACCESS_TOKEN_HERE in this file");
console.log("6. Run: node backend/scripts/test-instructor-api.js");
console.log("\n" + "=".repeat(60) + "\n");

testInstructorCourses();
