import Groq from "groq-sdk";
import prisma from '../lib/prisma.js';
import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Initialize Groq SDK
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    if (!process.env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is missing. Make sure it is set in .env");
        return res.status(500).json({ error: "Server configuration error: GROQ_API_KEY missing" });
    }


    // 1. Fetch relevant specialized data
    // Direct DB fetch (Redis removed as per request)
    // Optimize: Only fetch Active/Approved courses
    const courses = await prisma.courses.findMany({
      where: {
        Status: 'Ongoing',
        ApprovalStatus: 'APPROVED'
      },
      select: {
        Id: true,
        Title: true,
        Description: true,
        Price: true,
        Level: true,
        Outcomes: true, // What they will learn
        TotalRating: true,
        RatingCount: true,
        Instructors: {
            select: {
                Users_Instructors_CreatorIdToUsers: {
                    select: {
                        FullName: true
                    }
                }
            }
        },
        Categories: {
            select: {
                Title: true
            }
        }
      },
    });

    console.log("Fetched Courses for Chatbot:", courses.length);

    const courseContext = courses.map(c => {
        const rating = c.RatingCount > 0 ? (Number(c.TotalRating) / c.RatingCount).toFixed(1) : "New";
        
        // Format price to VND
        const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.Price || 0);
        
        return `
        - COURSE ID: ${c.Id}
        - TITLE: "${c.Title}"
        - INSTRUCTOR: ${c.Instructors?.Users_Instructors_CreatorIdToUsers?.FullName || 'Unknown'}
        - CATEGORY: ${c.Categories?.Title || 'General'}
        - LEVEL: ${c.Level}
        - PRICE: ${priceFormatted} (Rating: ${rating} ⭐)
        - KEY OUTCOMES: ${c.Outcomes}
        - DESCRIPTION: ${c.Description}
        ----------------------------------`;
    }).join("\n");

    // 2. Construct the prompt
    // Use llama-3.3-70b-versatile on Groq
    const model = "llama-3.3-70b-versatile";

    const prompt = `
    You are "FlyUp", a professional and concise Academic Counselor.

    ### KNOWLEDGE BASE (Courses):
    ${courseContext}

    ### INSTRUCTIONS:
    1.  **Direct Answer**: match the user's intent immediately.
    2.  **Course Cards**: When recommending courses, use this clean format:
        *   **[Course Title]**
        *   💰 Price: [Price in VND]
        *   👨‍🏫 Instructor: [Name]
        *   ✨ Why this fits: [1 short sentence linking to user needs]
    3.  **Language**: Reply in the same language as the user (Vietnamese if they speak Vietnamese).
    4.  **Tone**: Helpful, short, and to the point. No fluff.
    5.  **Data**: Use the provided VND price exactly.

    User's Message: "${message}"
    
    Your Response:
    `;

    // 3. Generate response using Groq
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: model,
        temperature: 0.5,
        max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ response: text });

  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
};

export const tts = async (req, res) => {
  try {
    const { text, lang = 'vi' } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const results = await googleTTS.getAllAudioBase64(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?:;'
    });
    return res.status(200).json({ urls: results });
  } catch (error) {
    console.error("TTS Error:", error);
    return res.status(500).json({ error: "Failed to generate TTS audio URLs" });
  }
};

export const transcribeVideo = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY missing" });
    }

    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.mp4`);
    
    console.log(`[TRANSCRIBE] Downloading video from ${videoUrl}`);
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error("Failed to download video from URL");
    
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
    console.log(`[TRANSCRIBE] Saved video to ${tempFilePath}`);

    console.log(`[TRANSCRIBE] Sending to Groq Whisper...`);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      prompt: "Bài giảng học thuật",
      response_format: "text",
      language: "vi",
    });

    try {
        fs.unlinkSync(tempFilePath);
    } catch (e) {
        console.error("Failed to delete temp file:", e);
    }

    console.log(`[TRANSCRIBE] Transcription success`);
    return res.status(200).json({ text: transcription });
  } catch (error) {
    console.error("Transcription Error:", error);
    return res.status(500).json({ error: "Failed to transcribe video" });
  }
};
