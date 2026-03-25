import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// הגדרת הלקוח בצורה חכמה:
// אם אנחנו בסביבת פיתוח (Local) -> משתמש ב-LM Studio
// אם אנחנו בשרת (Vercel) -> משתמש ב-Groq
const client = new OpenAI({
  baseURL: process.env.NODE_ENV === "development" 
    ? "http://127.0.0.1:1234/v1" 
    : "https://api.groq.com/openai/v1",
  
  apiKey: process.env.NODE_ENV === "development" 
    ? "lm-studio" 
    : process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const completion = await client.chat.completions.create({
      // בחירת מודל לפי הסביבה
      model: process.env.NODE_ENV === "development" 
        ? "nvidia/nemotron-3-nano-4b" 
        : "llama-3.3-70b-versatile", 
      
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a supportive and knowledgeable friend to a dog owner. " +
            "Your goal is to explain what the dog's data means in plain, warm language. " +
            "If the heart rate is 0, start by suggesting it's likely a sensor glitch. " +
            "Don't just list numbers—interpret them. For example, instead of 'Emotion: SAD', " +
            "say 'It looks like they are feeling a bit down or low-energy right now.' " +
            "Keep it under 120 words and use a friendly, conversational tone. " +
            "Include 1-2 practical things the owner can do right now.",
        },
        {
          role: "user",
          content: `Hey, here is what's happening with my dog right now:\n\n${JSON.stringify({
            dog: body?.dog ?? null,
            liveMetrics: body?.liveMetrics ?? null,
            barkAnalysis: body?.barkAnalysis ?? null,
            finalEmotion: body?.finalEmotion ?? null,
            finalRussell: body?.finalRussell ?? null,
            now: new Date().toISOString(),
          }, null, 2)}`,
        },
      ],
    });

    // 1. קבלת הטקסט הגולמי
    let text = completion.choices?.[0]?.message?.content ?? "";

    // 2. ניקוי בלוק המחשבות <think>
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // 3. החזרת התוצאה הנקייה
    return NextResponse.json({ text });

  } catch (err: any) {
    console.error("❌ Inference failed:", err);
    return NextResponse.json(
      { error: "inference_failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}