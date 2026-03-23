import dotenv from 'dotenv';
import Groq from 'groq-sdk';
dotenv.config();

async function test() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = "llama-3.3-70b-versatile";
    const prompt = `You are a helpful assistant. User's message: "Summarize this text: Hello world"`;

    console.log("Sending request to Groq SDK...");
    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model,
        temperature: 0.5,
        max_tokens: 1024,
    });
    console.log("Response:", completion.choices[0]?.message?.content);
  } catch (error) {
    console.error("Groq Error:", error);
  }
}

test();
