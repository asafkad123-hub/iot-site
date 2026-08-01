import { NextRequest, NextResponse } from "next/server";
import {
    visionSupabase,
    VISION_STORAGE_BUCKET,
} from "@/lib/vision-supabase";

// 1. INCREASE THE TIMEOUT
// Vercel Hobby allows up to 60. Pro allows up to 300.
export const maxDuration = 60; 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_VIDEO_TYPES = new Set([
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
]);

function sanitizeFilename(filename: string): string {
    const extension = filename
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    return extension ? `video.${extension}` : "video.mp4";
}

export async function POST(request: NextRequest) {
    let uploadedStoragePath: string | null = null;

    try {
        const formData = await request.formData();
        const video = formData.get("video");

        if (!(video instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No video file was received.",
                },
                { status: 400 }
            );
        }

        if (video.size === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "The video file is empty.",
                },
                { status: 400 }
            );
        }

        if (video.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: "The maximum video size is 100MB.",
                },
                { status: 413 }
            );
        }

        if (video.type && !ALLOWED_VIDEO_TYPES.has(video.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "This video file type is not supported.",
                },
                { status: 415 }
            );
        }

        const jobId = crypto.randomUUID();
        const safeFilename = sanitizeFilename(video.name);

        uploadedStoragePath = `uploads/${jobId}/${safeFilename}`;

        // Note: For files up to 100MB, buffering into RAM in a serverless function 
        // can cause Out-of-Memory (OOM) crashes. If you start seeing 500 errors, 
        // you will need to switch to direct client-to-Supabase uploads.
        const videoBytes = Buffer.from(await video.arrayBuffer());

        const { error: uploadError } = await visionSupabase.storage
            .from(VISION_STORAGE_BUCKET)
            .upload(uploadedStoragePath, videoBytes, {
                contentType: video.type || "video/mp4",
                upsert: false,
            });

        if (uploadError) {
            throw new Error(
                `Video upload failed: ${uploadError.message}`
            );
        }

        const { data: job, error: jobError } = await visionSupabase
            .from("video_jobs")
            .insert({
                id: jobId,
                status: "pending",
                storage_path: uploadedStoragePath,
                original_filename: video.name,
            })
            .select("id, status, created_at")
            .single();

        if (jobError) {
            await visionSupabase.storage
                .from(VISION_STORAGE_BUCKET)
                .remove([uploadedStoragePath]);

            uploadedStoragePath = null;

            throw new Error(
                `Job creation failed: ${jobError.message}`
            );
        }

        return NextResponse.json(
            {
                success: true,
                jobId: job.id,
                status: job.status,
            },
            { status: 202 }
        );
    } catch (error) {
        console.error("analyze-video error:", error);

        if (uploadedStoragePath) {
            try {
                await visionSupabase.storage
                    .from(VISION_STORAGE_BUCKET)
                    .remove([uploadedStoragePath]);
            } catch {
                // Ignore cleanup errors.
            }
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while creating the analysis job.",
            },
            { status: 500 }
        );
    }
}