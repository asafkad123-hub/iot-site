"use client";

import { useMemo, useState } from "react";
import {
  Card,
  ConfidenceBar,
  IconAlert,
  IconBark,
  IconCalm,
  IconHeart,
  IconMove,
  IconSmile,
  IconWave,
  Metric,
  PageShell,
  Pill,
  SecondaryButton,
} from "../_components/ds";

type Emotion = "Happy" | "Calm" | "Anxious";

export default function DashboardPage() {
  // נתוני דמו (בהמשך יוחלפו ב-Supabase/ESP32)
  const [emotion, setEmotion] = useState<Emotion>("Happy");
  const confidence = useMemo(() => (emotion === "Happy" ? 84 : emotion === "Calm" ? 76 : 69), [emotion]);

  const emotionIcon = useMemo(() => {
    if (emotion === "Happy") return <IconSmile />;
    if (emotion === "Calm") return <IconCalm />;
    return <IconAlert />;
  }, [emotion]);

  const emotionHint = useMemo(() => {
    if (emotion === "Happy") return "calm + engaged";
    if (emotion === "Calm") return "resting + stable";
    return "elevated stress signals";
  }, [emotion]);

  return (
    <PageShell
      rightSlot={
        <div className="flex items-center gap-2">
          <SecondaryButton href="/connect">Back</SecondaryButton>
          <SecondaryButton href="/">Home</SecondaryButton>
        </div>
      }
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
            <div className="mt-1 text-sm text-zinc-600">Your dog’s live emotional state and sensor metrics</div>
          </div>

          <div className="flex items-center gap-2">
            <Pill label="Device: collar-01" />
            <Pill label="Status: Online" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Emotion */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Emotion</div>
                <div className="mt-1 text-xs text-zinc-500">AI inference (demo)</div>
              </div>

              <div className="flex items-center gap-2">
                {/* דמו: אפשר להחליף רגש */}
                <button
                  onClick={() => setEmotion("Happy")}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm",
                    emotion === "Happy" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700",
                  ].join(" ")}
                >
                  Happy
                </button>
                <button
                  onClick={() => setEmotion("Calm")}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm",
                    emotion === "Calm" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700",
                  ].join(" ")}
                >
                  Calm
                </button>
                <button
                  onClick={() => setEmotion("Anxious")}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm",
                    emotion === "Anxious" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700",
                  ].join(" ")}
                >
                  Anxious
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700">
                  {emotionIcon}
                </span>
                <div>
                  <div className="text-lg font-semibold">{emotion}</div>
                  <div className="text-xs text-zinc-500">{emotionHint}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-zinc-500">confidence</div>
                <div className="text-lg font-semibold">{confidence}%</div>
              </div>
            </div>

            <ConfidenceBar pct={confidence} />
          </Card>

          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Heart Rate" value="92 bpm" hint="stable" icon={<IconHeart />} />
            <Metric label="HRV" value="48 ms" hint="moderate" icon={<IconWave />} />
            <Metric label="Movement" value="High" hint="posture + activity" icon={<IconMove />} />
            <Metric label="Bark level" value="Low" hint="pattern normal" icon={<IconBark />} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
