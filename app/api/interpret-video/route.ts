import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                {
                    success: false,
                    error: "OPENAI_API_KEY is missing",
                },
                { status: 500 }
            );
        }

        const body = await request.json();

        if (!body?.result) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Analysis result is required",
                },
                { status: 400 }
            );
        }

        const response = await openai.responses.create({
            model: "gpt-5-mini",
            input: [
                {
                    role: "system",
                    content:
                        "You explain canine vision-analysis reports. Use only information supplied in the report. Do not diagnose medical conditions.",
                },
                {
                    role: "user",
                    content: `Write a concise professional interpretation of this report:\n\n${JSON.stringify(
                        body.result
                    )}`,
                },
            ],
        });

        return NextResponse.json({
            success: true,
            interpretation: response.output_text,
        });
    } catch (error) {
        console.error("OpenAI interpretation error:", error);

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Could not generate interpretation",
            },
            { status: 500 }
        );
    }
}