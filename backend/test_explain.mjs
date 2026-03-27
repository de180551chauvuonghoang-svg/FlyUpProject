// Test the AI explain endpoint
const payload = {
  questionContent: "Which command lists directory contents?",
  selectedChoiceContent: "ls",
  correctChoiceContent: "ls",
  isCorrect: true,
  choices: [
    { content: "ls" },
    { content: "pwd" },
    { content: "cd" },
    { content: "cat" }
  ],
  sectionId: null
};

// We need a valid JWT token. Let's first get one by logging in
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "student@flyup.com", password: "password123" })
});

const loginData = await loginResponse.json();
console.log("Login response status:", loginResponse.status);
console.log("Login data:", JSON.stringify(loginData, null, 2));

const token = loginData.accessToken || loginData.data?.accessToken || loginData.token;
if (!token) {
  console.error("Could not get token! Trying without auth...");
}

// Call the explain endpoint
const response = await fetch("http://localhost:5000/api/quiz/cat/explain", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  body: JSON.stringify(payload)
});

const data = await response.json();
console.log("\n=== EXPLAIN ENDPOINT ===");
console.log("Status:", response.status);
console.log("Response:", JSON.stringify(data, null, 2));
