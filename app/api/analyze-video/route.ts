import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    visionSupabase,
    VISION_STORAGE_BUCKET,
} from "@/lib/vision-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const SITE_SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MAX_FILE_SIZE =
    50 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = new Set([
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
]);

function safeExtension(
    filename: string,
    contentType: string
) {
    const raw =
        filename
            .split(".")
            .pop()
            ?.toLowerCase() || "";

    if (/^[a-z0-9]{1,8}$/.test(raw)) {
        return raw;
    }

    if (contentType.includes("quicktime")) {
        return "mov";
    }

    if (contentType.includes("webm")) {
        return "webm";
    }

    return "mp4";
}

async function getAuthenticatedUser(
    request: NextRequest
) {
    if (
        !SITE_SUPABASE_URL ||
        !SITE_SUPABASE_ANON_KEY
    ) {
        throw new Error(
            "Site Supabase configuration is missing."
        );
    }

    const authorization =
        request.headers.get("authorization");

    if (
        !authorization?.startsWith(
            "Bearer "
        )
    ) {
        return null;
    }

    const token =
        authorization.slice(7);

    const siteSupabase =
        createClient(
            SITE_SUPABASE_URL,
            SITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            }
        );

    const {
        data: { user },
        error,
    } =
        await siteSupabase.auth.getUser(
            token
        );

    if (error || !user) {
        return null;
    }

    return user;
}

export async function POST(
    request: NextRequest
) {
    try {
        const user =
            await getAuthenticatedUser(
                request
            );

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "You must be logged in.",
                },
                { status: 401 }
            );
        }

        const body =
            await request.json();

        const action =
            body?.action;

        /*
         * STEP 1:
         * Prepare a direct upload.
         */
        if (action === "prepare") {
            const filename =
                String(
                    body?.filename || ""
                );

            const contentType =
                String(
                    body?.contentType ||
                        "video/mp4"
                );

            const fileSize =
                Number(
                    body?.fileSize || 0
                );

            if (!filename) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Missing filename.",
                    },
                    { status: 400 }
                );
            }

            if (
                !Number.isFinite(
                    fileSize
                ) ||
                fileSize <= 0
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Invalid video size.",
                    },
                    { status: 400 }
                );
            }

            if (
                fileSize >
                MAX_FILE_SIZE
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "File is too large. Max size is 50MB.",
                    },
                    { status: 413 }
                );
            }

            if (
                contentType &&
                !ALLOWED_VIDEO_TYPES.has(
                    contentType
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "This video type is not supported.",
                    },
                    { status: 415 }
                );
            }

            const jobId =
                crypto.randomUUID();

            const extension =
                safeExtension(
                    filename,
                    contentType
                );

            const storagePath =
                `uploads/${user.id}/${jobId}/video.${extension}`;

            const {
                data: signedData,
                error: signedError,
            } =
                await visionSupabase.storage
                    .from(
                        VISION_STORAGE_BUCKET
                    )
                    .createSignedUploadUrl(
                        storagePath
                    );

            if (
                signedError ||
                !signedData
            ) {
                throw new Error(
                    `Could not create signed upload URL: ${
                        signedError?.message ||
                        "Unknown error"
                    }`
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    action:
                        "prepare",
                    jobId,
                    storagePath,
                    signedUrl:
                        signedData.signedUrl,
                },
                { status: 200 }
            );
        }

        /*
         * STEP 2:
         * File is already in Vision Storage.
         * Now create the pending worker job.
         */
        if (action === "finalize") {
            const jobId =
                String(
                    body?.jobId || ""
                );

            const storagePath =
                String(
                    body?.storagePath || ""
                );

            const filename =
                String(
                    body?.filename || ""
                );

            if (
                !jobId ||
                !storagePath
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Missing job information.",
                    },
                    { status: 400 }
                );
            }

            const expectedPrefix =
                `uploads/${user.id}/${jobId}/`;

            if (
                !storagePath.startsWith(
                    expectedPrefix
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Invalid storage path.",
                    },
                    { status: 403 }
                );
            }

            const {
                data: job,
                error: jobError,
            } =
                await visionSupabase
                    .from(
                        "video_jobs"
                    )
                    .insert({
                        id: jobId,
                        status:
                            "pending",
                        storage_path:
                            storagePath,
                        original_filename:
                            filename ||
                            "video.mp4",
                    })
                    .select(
                        "id, status"
                    )
                    .single();

            if (
                jobError ||
                !job
            ) {
                await visionSupabase.storage
                    .from(
                        VISION_STORAGE_BUCKET
                    )
                    .remove([
                        storagePath,
                    ]);

                throw new Error(
                    `Could not create video job: ${
                        jobError?.message ||
                        "Unknown database error"
                    }`
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    action:
                        "finalize",
                    jobId:
                        job.id,
                    status:
                        job.status,
                },
                { status: 202 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Unknown action.",
            },
            { status: 400 }
        );
    } catch (error) {
        console.error(
            "analyze-video error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Server error",
            },
            { status: 500 }
        );
    }
}