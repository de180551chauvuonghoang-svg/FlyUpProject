import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Initialize Gemini here to ensure env vars are loaded
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing. Make sure it is set in .env");
        return res.status(500).json({ error: "Server configuration error: GEMINI_API_KEY missing" });
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
    // Use gemini-1.5-flash for best balance of speed and intelligence
    // Use gemini-pro for maximum compatibility and stability
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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

    // 3. Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ response: text });

  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
};
