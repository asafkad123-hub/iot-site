import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV === "development";

const client = new OpenAI({
  baseURL: isDev
    ? "http://127.0.0.1:1234/v1"
    : "https://api.groq.com/openai/v1",
  apiKey: isDev ? "lm-studio" : process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const completion = await client.chat.completions.create({
      model: isDev
        ? "nvidia/nemotron-3-nano-4b"
        : "llama-3.3-70b-versatile",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a supportive, knowledgeable companion to a dog owner. " +
            "You interpret live collar data in plain, warm language. " +
            "Focus on trends, not raw numbers. " +
            "If heart rate is 0, assume sensor issue. " +
            "Never diagnose. Keep under 130 words. " +
            "Give 1–2 practical actions the owner can take right now.",
        },
        {
          role: "user",
          content:
            "Here's what's happening with my dog right now:\n\n" +
            JSON.stringify(
              {
                dog: body?.dog ?? null,
                liveMetrics: body?.liveMetrics ?? null,
                barkAnalysis: body?.barkAnalysis ?? null,
                finalEmotion: body?.finalEmotion ?? null,
                finalRussell: body?.finalRussell ?? null,
                trends: body?.trends ?? null,
                valenceReliable: body?.valenceReliable ?? null,
                activeContext: body?.activeContext ?? null,
                now: new Date().toISOString(),
              },
              null,
              2
            ),
        },
      ],
    });

    let text = completion.choices?.[0]?.message?.content ?? "";
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Assistant API error:", err);
    return NextResponse.json(
      { error: "inference_failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}