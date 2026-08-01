import { NextRequest, NextResponse } from "next/server";
import { visionSupabase } from "@/lib/vision-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        const { data, error } = await visionSupabase
            .from("video_jobs")
            .select("*")
            .eq("id", jobId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Job not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            status: data.status,
            result: data.result,
            error: data.error_message,
        });

    } catch (err) {

        console.error(err);

        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
            },
            {
                status: 500,
            }
        );

    }
}