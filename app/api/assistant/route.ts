import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // The browser computes the trend "shape" and sends it in body.trends.
    // We hand the model BOTH the live snapshot and the trend summary, and ask
    // it to read the trend like it would read the scatter plot.
    const completion = await client.chat.completions.create({
      model: "openrouter/free",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a supportive, knowledgeable companion to a dog owner, looking at live data from a smart collar. " +
            "The collar places the dog on two axes: valence (pleasant vs unpleasant) and arousal (calm vs activated). " +
            "You are given (a) a live snapshot and (b) a TREND SUMMARY describing how the dog's recent points are MOVING on that plane " +
            "(drift direction, slope, how tight or spread-out the cluster is, which quadrant dominates, and trends in restlessness and a wellbeing-deviation score). " +
            "Read the trend like a shape on a chart: e.g. a tight cluster low-and-right means settled contentment; " +
            "a cloud drifting up-and-left means rising agitation; widening spread means growing restlessness. " +
            "Rules: " +
            "1) Interpret, don't list numbers. Say what it MEANS in warm, plain language. " +
            "2) Lead with the TREND (what's changing), not just the current point. " +
            "3) If valence is marked unreliable/unvalidated, hedge valence ('seems', 'might') and lean on arousal, restlessness, and wellbeing, which are reliable. " +
            "4) If heart rate is 0 or missing, say it's likely a sensor-contact glitch and to check collar fit, and don't over-read emotion. " +
            "5) Never invent a diagnosis. If the data is calm/positive, reassure. If wellbeing-deviation is high or the trend is worsening, gently flag it and suggest checking on the dog. " +
            "6) Give 1-2 concrete things the owner can do right now. " +
            "7) Under 130 words, conversational, no bullet lists, no headers. " +
            "8) Use ALL available supplied data sources together, including liveMetrics, motion, barkAnalysis, trends, finalEmotion, finalRussell, activeContext, and visionAnalysis. " +
            "9) Ground every interpretation in the supplied data. Never invent observations, events, symptoms, emotions, measurements, or context that were not provided. " +
            "10) If multiple data sources support the same interpretation, combine them into one clear explanation. " +
            "11) If data sources disagree, explicitly say that the signals are mixed or conflicting and explain which observations differ. " +
            "12) If relevant data is missing or insufficient, clearly say that the available data is not enough to determine the answer. " +
            "13) Treat visionAnalysis as an observational source from the uploaded video, and combine it with collar telemetry rather than treating it as automatically more reliable. " +
            "14) Answer the user's actual question when one is present in the conversation history.",
        },
        {
          role: "user",
          content:
            `Here's what's happening with my dog right now: \n\n` +
            JSON.stringify(
              {
                dog: body?.dog ?? null,
                liveMetrics: body?.liveMetrics ?? null,
                motion: body?.motion ?? null,
                barkAnalysis: body?.barkAnalysis ?? null,
                finalEmotion: body?.finalEmotion ?? null,
                finalRussell: body?.finalRussell ?? null,
                trends: body?.trends ?? null,
                valenceReliable: body?.valenceReliable ?? null,
                activeContext: body?.activeContext ?? null,
                visionAnalysis: body?.visionAnalysis ?? null,
                now: new Date().toISOString(),
              },
              null,
              2
            ),
        },

        ...(Array.isArray(body?.messages)
          ? body.messages
              .filter(
                (message: any) =>
                  (message?.role === "user" ||
                    message?.role === "assistant") &&
                  typeof message?.content === "string"
              )
              .map((message: any) => ({
                role: message.role,
                content: message.content,
              }))
          : []),
      ],
    });

    console.log("OpenRouter model used:", completion.model);

    let text = completion.choices?.[0]?.message?.content ?? "";
    // strip any chain-of-thought block the model emits
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("openrouter-inference failed:", err);
    return NextResponse.json(
      { error: "inference_failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
