"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  PageShell,
  Card,
  Metric,
  IconHeart,
  IconMove,
  IconBark,
  IconSmile,
  ConfidenceBar,
  Pill,
  SecondaryButton,
  Field,
  PrimaryButton,
} from "../_components/ds";

type RussellVec = { valence: number; arousal: number; weight: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function emotionToRussellVec(emotionRaw: any): { valence: number; arousal: number } {
  const e = String(emotionRaw ?? "").toLowerCase();

  if (e.includes("happy")) return { valence: 0.8, arousal: 0.6 };
  if (e.includes("excited") || e.includes("playful")) return { valence: 0.7, arousal: 0.85 };
  if (e.includes("content") || e.includes("relaxed") || e.includes("calm")) return { valence: 0.6, arousal: -0.4 };

  if (e.includes("angry")) return { valence: -0.8, arousal: 0.7 };
  if (e.includes("agitated") || e.includes("stressed")) return { valence: -0.6, arousal: 0.8 };

  if (e.includes("sad")) return { valence: -0.75, arousal: -0.6 };
  if (e.includes("depressed") || e.includes("tired")) return { valence: -0.6, arousal: -0.75 };

  if (e.includes("neutral") || e.includes("mixed") || e.includes("uncertain")) return { valence: 0, arousal: 0 };

  return { valence: 0, arousal: 0 };
}

function classifyRussell(valence: number, arousal: number) {
  const mag = Math.sqrt(valence * valence + arousal * arousal);
  const angle = (Math.atan2(arousal, valence) * 180) / Math.PI;

  let emotion = "MIXED/UNCERTAIN";
  let confidence = "LOW";

  if (mag < 0.25) {
    emotion = "NEUTRAL/CALM";
    confidence = "LOW";
  } else if (valence > 0.15 && arousal > 0.15) {
    emotion = "HAPPY";
    confidence = mag > 0.55 ? "HIGH" : "MODERATE";
  } else if (valence < -0.15 && arousal > 0.15) {
    emotion = "ANGRY";
    confidence = mag > 0.55 ? "HIGH" : "MODERATE";
  } else if (valence < -0.15 && arousal < -0.15) {
    emotion = "SAD";
    confidence = mag > 0.55 ? "HIGH" : "MODERATE";
  } else if (arousal > 0.2) {
    emotion = valence > 0 ? "EXCITED/PLAYFUL" : "AGITATED/STRESSED";
    confidence = "MODERATE";
  } else if (arousal < -0.2) {
    emotion = valence > 0 ? "CONTENT/RELAXED" : "DEPRESSED/TIRED";
    confidence = "MODERATE";
  }

  return { emotion, confidence, magnitude: mag, angle };
}

function getRussellFromBarkAnalysis(barkAnalysis: any): RussellVec | null {
  if (!barkAnalysis) return null;

  const v = barkAnalysis?.valence;
  const a = barkAnalysis?.arousal;

  const hasNumbers =
    typeof v === "number" &&
    typeof a === "number" &&
    Number.isFinite(v) &&
    Number.isFinite(a);

  const fallback = emotionToRussellVec(
    barkAnalysis?.consensus_emotion ?? barkAnalysis?.mamba_pred
  );

  const valence = hasNumbers ? v : fallback.valence;
  const arousal = hasNumbers ? a : fallback.arousal;

  const weight =
    (typeof barkAnalysis?.magnitude === "number" && Number.isFinite(barkAnalysis.magnitude)
      ? barkAnalysis.magnitude
      : undefined) ??
    (typeof barkAnalysis?.mamba_max_prob === "number" && Number.isFinite(barkAnalysis.mamba_max_prob)
      ? barkAnalysis.mamba_max_prob
      : undefined) ??
    1;

  return { valence, arousal, weight: clamp(weight, 0.1, 2.0) };
}

function getRussellFromDogMetrics(liveMetrics: any): RussellVec | null {
  if (!liveMetrics) return null;

  const v = liveMetrics?.valence;
  const a = liveMetrics?.arousal;

  const hasNumbers =
    typeof v === "number" &&
    typeof a === "number" &&
    Number.isFinite(v) &&
    Number.isFinite(a);

  const base = hasNumbers
    ? { valence: v, arousal: a }
    : emotionToRussellVec(liveMetrics?.emotion ?? liveMetrics?.mood);

  const wRaw = liveMetrics?.confidence ?? liveMetrics?.emotion_confidence;
  const weight = typeof wRaw === "number" && Number.isFinite(wRaw) ? clamp(wRaw, 0.1, 2.0) : 1;

  return { valence: base.valence, arousal: base.arousal, weight };
}

function combineRussellVectors(v1: RussellVec | null, v2: RussellVec | null) {
  const a = v1 ?? { valence: 0, arousal: 0, weight: 0 };
  const b = v2 ?? { valence: 0, arousal: 0, weight: 0 };

  const sumW = a.weight + b.weight;

  if (sumW <= 0.0001) {
    return classifyRussell(0, 0);
  }

  const valence = (a.valence * a.weight + b.valence * b.weight) / sumW;
  const arousal = (a.arousal * a.weight + b.arousal * b.weight) / sumW;

  return classifyRussell(clamp(valence, -1, 1), clamp(arousal, -1, 1));
}

function formatTime(ts: any) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString();
}

function pct(n: any) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

export default function DashboardPage() {
  const [dog, setDog] = useState<any>(null);

  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [barkAnalysis, setBarkAnalysis] = useState<any>(null);

  const [finalEmotion, setFinalEmotion] = useState<string>("Waiting...");
  const [finalConfidencePct, setFinalConfidencePct] = useState<number>(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    breed: "",
    weight: "",
    age: "",
  });

  const router = useRouter();

  const refreshCooldownRef = useRef<number>(0);
  const refreshWithCooldown = () => {
    const now = Date.now();
    if (now - refreshCooldownRef.current < 800) return;
    refreshCooldownRef.current = now;
    router.refresh();
  };

  const recomputeFinalEmotion = (metrics: any, bark: any) => {
    const vecMetrics = getRussellFromDogMetrics(metrics);
    const vecBark = getRussellFromBarkAnalysis(bark);
    const combined = combineRussellVectors(vecMetrics, vecBark);

    setFinalEmotion(combined.emotion);

    const pctVal = Math.round(clamp(combined.magnitude / 1.0, 0, 1) * 100);
    setFinalConfidencePct(pctVal);
  };

  const getData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return router.push("/login");

    const { data: dogData } = await supabase
      .from("dogs")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (dogData) {
      setDog(dogData);
      setEditForm({
        name: dogData.name ?? "",
        breed: dogData.breed ?? "",
        weight: String(dogData.weight ?? ""),
        age: String(dogData.age ?? ""),
      });
    }

    const { data: metricsData } = await supabase
      .from("dog_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (metricsData) setLiveMetrics(metricsData);

    const { data: barkData } = await supabase
      .from("bark_analysis_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (barkData) setBarkAnalysis(barkData);

    recomputeFinalEmotion(metricsData ?? null, barkData ?? null);
  };

  useEffect(() => {
    getData();

    const metricsChannel = supabase
      .channel("realtime-dog-metrics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dog_metrics" },
        async (payload) => {
          console.log("New dog_metrics row:", payload.new);
          const newMetrics = payload.new;
          setLiveMetrics(newMetrics);

          const { data: barkData } = await supabase
            .from("bark_analysis_results")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (barkData) setBarkAnalysis(barkData);

          recomputeFinalEmotion(newMetrics, barkData ?? barkAnalysis);
          refreshWithCooldown();
        }
      )
      .subscribe();

    const barkChannel = supabase
      .channel("realtime-bark-analysis")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bark_analysis_results" },
        async (payload) => {
          console.log("New bark_analysis_results row:", payload.new);
          const newBark = payload.new;
          setBarkAnalysis(newBark);

          const { data: metricsData } = await supabase
            .from("dog_metrics")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (metricsData) setLiveMetrics(metricsData);

          recomputeFinalEmotion(metricsData ?? liveMetrics, newBark);
          refreshWithCooldown();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(barkChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    recomputeFinalEmotion(liveMetrics, barkAnalysis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMetrics, barkAnalysis]);

  const handleUpdate = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("dogs")
      .update({
        name: editForm.name,
        breed: editForm.breed,
        weight: parseFloat(editForm.weight),
        age: parseInt(editForm.age),
      })
      .eq("user_id", session?.user.id);

    if (!error) {
      setIsEditing(false);
      getData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // =========================
  // DISPLAY VALUES
  // =========================

  const heartRateBpm = liveMetrics?.heart_rate ?? "--";
  const hrvMs = liveMetrics?.hrv ?? "--";
  const activityState = liveMetrics?.posture ?? "Unknown";

  const isConnected = Boolean(liveMetrics || barkAnalysis);

  // Barking label (prefer is_bark boolean if you added it)
  const barkingLabel =
    typeof barkAnalysis?.is_bark === "boolean"
      ? barkAnalysis.is_bark
        ? "Yes"
        : "No"
      : barkAnalysis
        ? "Yes"
        : "No";

  // “What kind of bark is this?”
  // Uses best available fields from bark_analysis_results
  const barkKind =
    barkAnalysis?.consensus_emotion ??
    barkAnalysis?.mamba_pred ??
    barkAnalysis?.russell_emotion ??
    barkAnalysis?.dtw_pred ??
    "—";

  // Additional bark stats
  const barkTime = formatTime(barkAnalysis?.created_at);
  const barkDuration =
    typeof barkAnalysis?.duration_sec === "number"
      ? `${barkAnalysis.duration_sec.toFixed(2)}s`
      : "—";
  const dogConf = pct(barkAnalysis?.dog_confidence);
  const mambaConf = pct(barkAnalysis?.mamba_max_prob);

  // If you stored probs as json array [happy, sad, angry]
  const probs = Array.isArray(barkAnalysis?.probs) ? barkAnalysis.probs : null;
  const probHappy = probs?.[0];
  const probSad = probs?.[1];
  const probAngry = probs?.[2];

  const russellVal =
    typeof barkAnalysis?.valence === "number" ? barkAnalysis.valence.toFixed(3) : "—";
  const russellAro =
    typeof barkAnalysis?.arousal === "number" ? barkAnalysis.arousal.toFixed(3) : "—";
  const russellMag =
    typeof barkAnalysis?.magnitude === "number" ? barkAnalysis.magnitude.toFixed(3) : "—";
  const russellAngle =
    typeof barkAnalysis?.angle === "number" ? `${barkAnalysis.angle.toFixed(1)}°` : "—";

  const consensusStrength =
    typeof barkAnalysis?.consensus_strength === "number"
      ? `${Math.round(barkAnalysis.consensus_strength * 100)}%`
      : "—";

  return (
    <PageShell
      subtitle="Live Telemetry"
      rightSlot={
        <SecondaryButton onClick={handleLogout}>Logout</SecondaryButton>
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter">
              {(dog?.name || "Dog") + "'s Status"}
            </h2>
            <p className="text-white/40 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">
              {dog?.breed || "—"} • {dog?.age ?? "—"} Years Old •{" "}
              {dog?.weight ?? "—"}kg
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </SecondaryButton>
            <Pill
              tone={isConnected ? "emerald" : "amber"}
              label={isConnected ? "Live Streams Active" : "Connecting..."}
            />
          </div>
        </div>

        {/* Dog Profile Card */}
        <div className="mb-6 sm:mb-8">
          <Card accent="violet">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight">
                  Dog Profile
                </div>
                <div className="text-white/40 text-sm italic">
                  {isEditing ? "Edit details" : "Saved details"}
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <Field
                  label="Name"
                  value={editForm.name}
                  onChange={(v: any) => setEditForm({ ...editForm, name: v })}
                />
                <Field
                  label="Breed"
                  value={editForm.breed}
                  onChange={(v: any) => setEditForm({ ...editForm, breed: v })}
                />
                <Field
                  label="Age"
                  type="number"
                  value={editForm.age}
                  onChange={(v: any) => setEditForm({ ...editForm, age: v })}
                />
                <Field
                  label="Weight"
                  type="number"
                  value={editForm.weight}
                  onChange={(v: any) => setEditForm({ ...editForm, weight: v })}
                />
                <div className="lg:col-span-4 pt-2">
                  <PrimaryButton onClick={handleUpdate}>
                    Save Changes
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Name
                  </div>
                  <div className="mt-1 text-base font-black text-white/85">
                    {dog?.name || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Breed
                  </div>
                  <div className="mt-1 text-base font-black text-white/85">
                    {dog?.breed || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Age
                  </div>
                  <div className="mt-1 text-base font-black text-white/85">
                    {dog?.age || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Weight
                  </div>
                  <div className="mt-1 text-base font-black text-white/85">
                    {dog?.weight || "—"}kg
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Live Section */}
        {!isEditing ? (
          <>
            <Card accent="fuchsia" className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="p-5 sm:p-6 bg-white/[0.05] rounded-3xl text-fuchsia-400">
                    <IconSmile />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                      {finalEmotion}
                    </div>
                    <div className="text-sm text-white/40 italic">
                      Final emotion = Russell vector combine (dog_metrics + bark_analysis_results)
                    </div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
                    Status
                  </div>
                  <div className="text-xl font-black text-white/90">
                    {isConnected ? "CONNECTED" : "OFFLINE"}
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <ConfidenceBar pct={finalConfidencePct} />
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
              <Metric
                label="Heart Rate"
                value={`${heartRateBpm} BPM`}
                icon={<IconHeart />}
              />
              <Metric label="HRV" value={`${hrvMs} ms`} icon={<IconHeart />} />
              <Metric label="Posture" value={activityState} icon={<IconMove />} />
              <Metric label="Barking" value={barkingLabel} icon={<IconBark />} />
            </div>

            {/* NEW: Bark Details UI */}
            <Card accent="amber" className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-5 bg-white/[0.05] rounded-3xl text-amber-300">
                    <IconBark />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Bark Analysis
                    </div>
                    <div className="text-sm text-white/40 italic">
                      What kind of bark + raw analysis details (latest row)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Pill
                    tone={typeof barkAnalysis?.is_bark === "boolean" ? (barkAnalysis.is_bark ? "emerald" : "amber") : "amber"}
                    label={typeof barkAnalysis?.is_bark === "boolean" ? (barkAnalysis.is_bark ? "BARK DETECTED" : "NOT A BARK") : "UNKNOWN"}
                  />
                  <Pill
                    tone="violet"
                    label={`Last: ${barkTime}`}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Kind of bark */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Kind of Bark (Best Available)
                  </div>
                  <div className="mt-2 text-2xl font-black text-white/90 uppercase">
                    {String(barkKind)}
                  </div>
                  <div className="mt-2 text-sm text-white/40">
                    Uses consensus → mamba → russell → dtw (fallback order)
                  </div>
                </div>

                {/* Model confidence */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Confidence + Validation
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-white/40">Dog (YAMNet)</div>
                      <div className="text-xl font-black text-white/90">{dogConf}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Mamba</div>
                      <div className="text-xl font-black text-white/90">{mambaConf}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Consensus Strength</div>
                      <div className="text-xl font-black text-white/90">{consensusStrength}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Duration</div>
                      <div className="text-xl font-black text-white/90">{barkDuration}</div>
                    </div>
                  </div>
                </div>

                {/* Russell + Probabilities */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Russell Vector + Class Probabilities
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-white/40">Valence</div>
                      <div className="text-lg font-black text-white/90">{russellVal}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Arousal</div>
                      <div className="text-lg font-black text-white/90">{russellAro}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Magnitude</div>
                      <div className="text-lg font-black text-white/90">{russellMag}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Angle</div>
                      <div className="text-lg font-black text-white/90">{russellAngle}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs text-white/40 mb-2">Probabilities (Happy / Sad / Angry)</div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="emerald" label={`Happy: ${pct(probHappy)}`} />
                      <Pill tone="amber" label={`Sad: ${pct(probSad)}`} />
                      <Pill tone="fuchsia" label={`Angry: ${pct(probAngry)}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional: raw JSON peek */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                    Latest bark_analysis_results row (debug)
                  </div>
                </div>
                <pre className="mt-3 text-xs text-white/60 overflow-x-auto">
                  {JSON.stringify(barkAnalysis ?? {}, null, 2)}
                </pre>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}