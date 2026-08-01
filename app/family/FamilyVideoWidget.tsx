"use client";

import React, { useRef, useState } from "react";

type Interpretation = {
    title: string;
    paragraphs: string[];
    recommendations: string[];
    confidence: number | null;
};

function getNumber(...values: unknown[]): number | null {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
    }

    return null;
}

function getText(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function includesAny(text: string, phrases: string[]) {
    const normalized = text.toLowerCase();
    return phrases.some((phrase) =>
        normalized.includes(phrase.toLowerCase())
    );
}

function buildAIInterpretation(result: any): Interpretation {
    const primaryDog =
        result?.primaryDog ||
        result?.dogs?.[0] ||
        null;

    const behavior = getText(
        result?.behaviorState,
        result?.behavior,
        result?.summary?.behaviorState,
        result?.summary?.behavior,
        primaryDog?.russell?.quadrant
    );

    const descriptor = getText(
        result?.summary?.descriptor,
        primaryDog?.russell?.descriptor
    );

    const dominantSystem = getText(
        result?.dominantSystem,
        result?.summary?.dominantSystem,
        primaryDog?.dominant_system
    ).toUpperCase();

    const valence = getNumber(
        result?.valence,
        result?.summary?.valence,
        primaryDog?.russell?.valence
    );

    const arousal = getNumber(
        result?.arousal,
        result?.summary?.arousal,
        primaryDog?.russell?.arousal
    );

    const confidence = getNumber(
        result?.confidence,
        result?.summary?.confidence,
        primaryDog?.overall_confidence
    );

    const behaviorText = getText(
        primaryDog?.sourceReports?.behaviorText
    );

    const emotionText = getText(
        primaryDog?.sourceReports?.emotionText
    );

    const narrative = getText(primaryDog?.narrative);

    const combinedReport = [
        behavior,
        descriptor,
        dominantSystem,
        behaviorText,
        emotionText,
        narrative,
    ]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();

    const isFearful =
        includesAny(combinedReport, [
            "fearful",
            "fear",
            "withdrawn",
            "avoidant",
        ]) ||
        (valence !== null &&
            arousal !== null &&
            valence < -0.2 &&
            arousal > 0.55);

    const isAnxious =
        includesAny(combinedReport, [
            "anxious",
            "anxiety",
            "stress",
            "uncertainty",
            "distress",
        ]) ||
        (valence !== null &&
            arousal !== null &&
            valence < 0 &&
            arousal > 0.45);

    const isPlayful =
        dominantSystem === "PLAY" ||
        includesAny(combinedReport, [
            "playful",
            "play_bow",
            "play bow",
        ]);

    const isSeeking =
        dominantSystem === "SEEKING" ||
        includesAny(combinedReport, [
            "environmental engagement",
            "exploration",
            "exploratory",
            "seeking",
        ]);

    const isCalm =
        includesAny(combinedReport, [
            "calm",
            "relaxed",
            "content",
            "low-arousal",
        ]) ||
        (valence !== null &&
            arousal !== null &&
            valence > 0.25 &&
            arousal < 0.6);

    const highArousal =
        arousal !== null && arousal >= 0.65;

    const positiveMood =
        valence !== null && valence >= 0.25;

    const hasNoticeableAsymmetry =
        includesAny(behaviorText, [
            "noticeable left-right difference",
            "notable left-right movement differences",
            "rear-side difference",
        ]);

    const hasMildAsymmetry =
        !hasNoticeableAsymmetry &&
        includesAny(behaviorText, [
            "mild left-right difference",
            "mild asymmetry",
        ]);

    const hasLimbAvoidance =
        includesAny(behaviorText, [
            "persistent limb avoidance",
            "unilateral non-use",
            "obvious unilateral non-use",
        ]) &&
        !includesAny(behaviorText, [
            "no clear automatic evidence",
            "no evidence",
        ]);

    const lowTrackingConfidence =
        includesAny(behaviorText, [
            "low-confidence keypoints",
            "low confidence pair",
            "partial visibility",
            "occlusion",
        ]);

    const walking =
        includesAny(behaviorText, [
            "dominant movement pattern: walking",
            "gait / locomotion class: walking",
        ]);

    const headLow =
        includesAny(behaviorText, [
            "head carriage: low",
            "head: predominantly low",
        ]);

    const paragraphs: string[] = [];
    const recommendations: string[] = [];

    let title = "Observed Emotional & Behavioral State";

    if (isFearful) {
        title = "Possible Fear or Discomfort Signals";
        paragraphs.push(
            "Your dog showed behavioral patterns that may be consistent with fear, caution, or discomfort during parts of this recording."
        );
    } else if (isAnxious) {
        title = "Possible Elevated Stress";
        paragraphs.push(
            "Your dog showed signs that may be consistent with increased stress or uncertainty during parts of this recording."
        );
    } else if (isCalm && positiveMood) {
        title = "Calm & Positive State";
        paragraphs.push(
            "Your dog appeared calm, emotionally comfortable, and positively engaged throughout most of this recording."
        );
    } else if (isPlayful && highArousal) {
        title = "Playful & Energetic State";
        paragraphs.push(
            "Your dog appeared energetic and engaged, with movement and emotional indicators consistent with a playful state."
        );
    } else if (highArousal) {
        title = "High Activity & Arousal";
        paragraphs.push(
            "Your dog showed elevated activity and arousal during this recording, indicating strong engagement with the surrounding environment."
        );
    } else {
        paragraphs.push(
            `The analysis was most consistent with ${behavior || "the observed behavioral state"
            }${descriptor ? ` — ${descriptor}` : ""}.`
        );
    }

    const activityDetails: string[] = [];

    if (walking) {
        activityDetails.push("controlled walking");
    }

    if (isSeeking) {
        activityDetails.push("environmental exploration");
    }

    if (isPlayful) {
        activityDetails.push("play-related engagement");
    }

    if (headLow) {
        activityDetails.push(
            "close attention to the ground or nearby surroundings"
        );
    }

    if (activityDetails.length > 0) {
        paragraphs.push(
            `The visible movement pattern was consistent with ${activityDetails.join(
                ", "
            )}.`
        );
    }

    if (isPlayful || isSeeking) {
        const emotionalSignals: string[] = [];

        if (isPlayful) {
            emotionalSignals.push("play-related");
        }

        if (isSeeking) {
            emotionalSignals.push("exploratory");
        }

        paragraphs.push(
            `${emotionalSignals.join(
                " and "
            )} emotional signals were present in the analyzed movement.`
        );
    }

    if (hasNoticeableAsymmetry) {
        paragraphs.push(
            "A noticeable left-to-right movement difference was detected, particularly around the rear body or hip region. This should be interpreted cautiously because camera angle, direction of travel, body orientation, and keypoint visibility can influence the measurement."
        );

        recommendations.push(
            "Capture another short video on a flat surface, ideally from the side and with the full body visible."
        );

        recommendations.push(
            "Monitor whether the same movement difference appears consistently across multiple recordings."
        );
    } else if (hasMildAsymmetry) {
        paragraphs.push(
            "A mild left-to-right movement difference was detected. This may reflect body angle, direction of movement, partial occlusion, or a temporary tracking variation."
        );

        recommendations.push(
            "Repeat the recording from a clear side view if you want to compare movement more reliably."
        );
    } else if (!hasLimbAvoidance) {
        paragraphs.push(
            "No clear signs of persistent limb avoidance, freezing, or complete non-use of a limb were identified in the visible portions of the recording."
        );
    }

    if (lowTrackingConfidence) {
        paragraphs.push(
            "Some body regions were tracked with limited confidence, so subtle movement differences cannot be confirmed or ruled out from this clip alone."
        );
    }

    if (isAnxious || isFearful) {
        recommendations.push(
            "Consider whether noise, unfamiliar surroundings, people, animals, or recent changes may have influenced the behavior."
        );

        recommendations.push(
            "Look for the same signals across several recordings rather than relying on a single clip."
        );
    }

    if (recommendations.length === 0) {
        recommendations.push(
            "Continue normal observation and compare future recordings for meaningful changes in mood or movement."
        );
    }

    return {
        title,
        paragraphs,
        recommendations,
        confidence:
            confidence === null
                ? null
                : Math.max(
                    0,
                    Math.min(100, Math.round(confidence * 100))
                ),
    };
}

export default function FamilyVideoWidget({
    onAnalysisComplete,
}: {
    onAnalysisComplete?: (result: any) => void;
}) {    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const wait = (milliseconds: number) =>
        new Promise<void>((resolve) => {
            window.setTimeout(resolve, milliseconds);
        });

    const processVideoFile = async (file: File) => {
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("video", file);

        try {
            const createResponse = await fetch("/api/analyze-video", {
                method: "POST",
                body: formData,
            });

            const createContentType =
                createResponse.headers.get("content-type");

            if (
                !createContentType ||
                !createContentType.includes("application/json")
            ) {
                const responseText = await createResponse.text();

                console.error(
                    "Server returned non-JSON response:",
                    responseText
                );

                throw new Error(
                    "Server error: The response was not valid JSON."
                );
            }

            const createData = await createResponse.json();

            if (!createResponse.ok || !createData.success) {
                throw new Error(
                    createData.error ||
                    "Could not create the video analysis job."
                );
            }

            const jobId = createData.jobId;

            if (!jobId) {
                throw new Error(
                    "The server did not return a job ID."
                );
            }

            const pollingStartedAt = Date.now();
            const pollingTimeout = 15 * 60 * 1000;

            while (
                Date.now() - pollingStartedAt <
                pollingTimeout
            ) {
                await wait(3000);

                const statusResponse = await fetch(
                    `/api/analyze-video/${jobId}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const statusContentType =
                    statusResponse.headers.get("content-type");

                if (
                    !statusContentType ||
                    !statusContentType.includes(
                        "application/json"
                    )
                ) {
                    const responseText =
                        await statusResponse.text();

                    console.error(
                        "Status endpoint returned non-JSON response:",
                        responseText
                    );

                    throw new Error(
                        "The server returned an invalid status response."
                    );
                }

                const statusData =
                    await statusResponse.json();

                if (
                    !statusResponse.ok ||
                    !statusData.success
                ) {
                    throw new Error(
                        statusData.error ||
                        "Could not check the analysis status."
                    );
                }

                if (statusData.status === "completed") {
                    if (!statusData.result) {
                        throw new Error(
                            "The analysis finished without a result."
                        );
                    }

                    setResult(statusData.result);
                    onAnalysisComplete?.(statusData.result);
                    return;
                }

                if (statusData.status === "failed") {
                    throw new Error(
                        statusData.error ||
                        "The video analysis failed."
                    );
                }
            }

            throw new Error(
                "The analysis is taking longer than expected."
            );
        } catch (err) {
            console.error(err);

            alert(
                err instanceof Error
                    ? err.message
                    : "Server communication error"
            );
        } finally {
            setLoading(false);

            if (uploadInputRef.current) {
                uploadInputRef.current.value = "";
            }
        }
    };

    const handleFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            alert("File is too large. Max size is 50MB.");
            event.target.value = "";
            return;
        }

        processVideoFile(file);
    };

    const interpretation = result
        ? buildAIInterpretation(result)
        : null;

    return (
        <div className="mb-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📹</span>

                        <h3 className="text-lg font-bold text-white">
                            Quick Behavior & Emotion Video
                            Analysis
                        </h3>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        AI Vision ML
                    </span>
                </div>

                {!result && !loading && (
                    <div>
                        <p className="text-xs text-white/60 mb-4">
                            Upload an existing video file of your
                            pet for behavior and emotion analysis.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                uploadInputRef.current?.click()
                            }
                            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition shadow-lg cursor-pointer text-sm flex items-center justify-center gap-2"
                        >
                            <span>📁</span>
                            Upload Video File
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    ref={uploadInputRef}
                    onChange={handleFileUpload}
                    accept="video/*"
                    className="hidden"
                />

                {loading && (
                    <div className="py-6 text-center text-violet-400 animate-pulse font-medium text-sm flex items-center justify-center gap-2">
                        <span>⚙️</span>
                        Uploading and analyzing video...
                    </div>
                )}

                {result && interpretation && (
                    <div className="mt-2 p-4 rounded-xl bg-black/40 border border-white/10 text-left space-y-3">
                        <h4 className="font-bold text-white text-sm border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>Analysis Results</span>

                            <span className="text-xs text-emerald-400 font-normal">
                                Completed
                            </span>
                        </h4>

                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            🐶
                                        </span>

                                        <h5 className="font-bold text-white text-sm">
                                            AI Interpretation
                                        </h5>
                                    </div>

                                    <p className="text-xs text-violet-300 mt-1 font-medium">
                                        {interpretation.title}
                                    </p>
                                </div>

                                {interpretation.confidence !==
                                    null && (
                                        <div className="shrink-0 rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-center">
                                            <span className="block text-[10px] uppercase tracking-wide text-white/50">
                                                Confidence
                                            </span>

                                            <span className="text-base font-bold text-white">
                                                {
                                                    interpretation.confidence
                                                }
                                                %
                                            </span>
                                        </div>
                                    )}
                            </div>

                            <div className="space-y-2">
                                {interpretation.paragraphs.map(
                                    (paragraph, index) => (
                                        <p
                                            key={index}
                                            className="text-sm leading-6 text-white/80"
                                        >
                                            {paragraph}
                                        </p>
                                    )
                                )}
                            </div>

                            {interpretation.recommendations.length >
                                0 && (
                                    <div className="mt-4 pt-3 border-t border-white/10">
                                        <span className="text-xs font-bold text-white block mb-2">
                                            Recommendations
                                        </span>

                                        <ul className="space-y-1.5">
                                            {interpretation.recommendations.map(
                                                (
                                                    recommendation,
                                                    index
                                                ) => (
                                                    <li
                                                        key={index}
                                                        className="text-xs leading-5 text-white/65 flex gap-2"
                                                    >
                                                        <span className="text-violet-300">
                                                            •
                                                        </span>
                                                        <span>
                                                            {
                                                                recommendation
                                                            }
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}

                            <p className="mt-4 text-[10px] leading-4 text-white/40 italic">
                                Analysis based only on the
                                visible portions of the uploaded
                                recording. This is not a
                                veterinary diagnosis.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-white/60 block mb-0.5">
                                    Behavior State
                                </span>

                                <span className="font-bold text-violet-400 text-sm capitalize">
                                    {result.behaviorState ||
                                        result.behavior ||
                                        result.summary
                                            ?.behaviorState ||
                                        result.summary
                                            ?.behavior ||
                                        "Active"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-white/60 block mb-0.5">
                                    Valence
                                </span>

                                <span className="font-bold text-white text-sm">
                                    {typeof result.valence ===
                                        "number"
                                        ? result.valence.toFixed(
                                            2
                                        )
                                        : typeof result.summary
                                            ?.valence ===
                                            "number"
                                            ? result.summary.valence.toFixed(
                                                2
                                            )
                                            : "N/A"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-white/60 block mb-0.5">
                                    Arousal
                                </span>

                                <span className="font-bold text-white text-sm">
                                    {typeof result.arousal ===
                                        "number"
                                        ? result.arousal.toFixed(
                                            2
                                        )
                                        : typeof result.summary
                                            ?.arousal ===
                                            "number"
                                            ? result.summary.arousal.toFixed(
                                                2
                                            )
                                            : "N/A"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setResult(null)}
                            className="w-full mt-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 cursor-pointer"
                        >
                            Analyze Another Video
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}