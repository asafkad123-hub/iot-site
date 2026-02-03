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
  const [emotion, setEmotion] = useState<Emotion>("Happy");
  const confidence = useMemo(
    () => (emotion === "Happy" ? 84 : emotion === "Calm" ? 76 : 69),
    [emotion]
  );

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
            <div className="text-2xl font-semibold tracking-tight text-white/90">
              Dashboard
            </div>
            <div className="mt-1 text-sm text-white/60">
              Your dog’s live emotional state and sensor metrics
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Pill tone="violet" label="Device: collar-01" />
            <Pill tone="emerald" label="Status: Online" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card accent="fuchsia">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white/90">Emotion</div>
                <div className="mt-1 text-xs text-white/55">AI inference (demo)</div>
              </div>

              <div className="flex items-center gap-2">
                <ToggleBtn active={emotion === "Happy"} onClick={() => setEmotion("Happy")}>
                  Happy
                </ToggleBtn>
                <ToggleBtn active={emotion === "Calm"} onClick={() => setEmotion("Calm")}>
                  Calm
                </ToggleBtn>
                <ToggleBtn active={emotion === "Anxious"} onClick={() => setEmotion("Anxious")}>
                  Anxious
                </ToggleBtn>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
                  {emotionIcon}
                </span>
                <div>
                  <div className="text-lg font-semibold text-white/90">{emotion}</div>
                  <div className="text-xs text-white/55">{emotionHint}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/55">confidence</div>
                <div className="text-lg font-semibold text-white/90">{confidence}%</div>
              </div>
            </div>

            <ConfidenceBar pct={confidence} />

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Pill tone="cyan" label="Realtime" />
              <Pill tone="violet" label="Stable UI" />
              <Pill tone="emerald" label="Ready for data" />
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric accent="fuchsia" label="Heart Rate" value="92 bpm" hint="stable" icon={<IconHeart />} />
            <Metric accent="cyan" label="HRV" value="48 ms" hint="moderate" icon={<IconWave />} />
            <Metric accent="emerald" label="Movement" value="High" hint="posture + activity" icon={<IconMove />} />
            <Metric accent="amber" label="Bark level" value="Low" hint="pattern normal" icon={<IconBark />} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border px-3 py-2 text-xs font-semibold transition",
        active
          ? "border-white/10 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
