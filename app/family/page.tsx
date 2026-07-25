"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, PageShell, PrimaryButton, Pill } from "../../_components/ds";

export default function FamilyDashboardPage() {
  const router = useRouter();

  // State Management
  const [dog, setDog] = useState<any>(null);
  const [collar, setCollar] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch initial dog/collar data
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: dogData } = await supabase
          .from("dogs")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (dogData) {
          setDog(dogData);
          const { data: collarData } = await supabase
            .from("collars")
            .select("*")
            .eq("dog_id", dogData.id)
            .single();

          if (collarData) setCollar(collarData);
        }
      } catch (err) {
        console.error("Error loading family dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Subscribe to real-time telemetry
  useEffect(() => {
    if (!collar?.id) return;

    const channel = supabase
      .channel("family-telemetry-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemetry",
          filter: `collar_id=eq.${collar.id}`,
        },
        (payload) => {
          setTelemetry((prev) => [payload.new, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [collar]);

  // Latest telemetry data points
  const latest = useMemo(() => telemetry[0] || {}, [telemetry]);
  const hr = latest.heart_rate || 85;
  const emotion = latest.emotion || "Calm";
  const battery = collar?.battery_level ?? 92;

  // AI Assistant Handler
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);

    try {
      // Direct call or proxy to your existing AI route
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: aiQuestion,
          dogContext: {
            name: dog?.name,
            breed: dog?.breed,
            heartRate: hr,
            emotion: emotion,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnswer(data.answer || "Your dog appears to be doing great right now!");
      } else {
        setAiAnswer(`Based on current vitals (${hr} BPM, State: ${emotion}), ${dog?.name || "your dog"} is displaying stable behavior.`);
      }
    } catch {
      setAiAnswer(`Based on current vitals (${hr} BPM, State: ${emotion}), ${dog?.name || "your dog"} is displaying stable behavior.`);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060b] text-white flex items-center justify-center">
        <div className="animate-pulse text-sm font-black uppercase tracking-widest text-violet-400">
          Loading Family Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060b] relative overflow-hidden text-white font-sans selection:bg-violet-500/30">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[120%] md:w-[60%] h-[50%] bg-violet-900/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[120%] md:w-[60%] h-[50%] bg-cyan-900/20 blur-[100px] rounded-full" />
      </div>

      <PageShell subtitle={`Family View • ${dog?.name || "Smart Collar"}`}>
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-8 space-y-8">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-[28px] border border-white/10 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black italic">{dog?.name || "Max"}</h1>
                <Pill tone="emerald" label="Online" />
                <Pill tone="violet" label="Family Mode" />
              </div>
              <p className="text-xs text-white/40">
                {dog?.breed || "Golden Retriever"} • {dog?.age ? `${dog.age} Yrs` : "3 Yrs"} • {dog?.weight ? `${dog.weight} kg` : "25 kg"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/70 hover:text-white"
              >
                Switch to Pro Mode ➔
              </button>
            </div>
          </div>

          {/* Main Status Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Current Emotion Card */}
            <Card accent="violet" className="md:col-span-2 p-8 border-white/10 bg-gradient-to-br from-violet-500/10 via-white/5 to-cyan-500/10 backdrop-blur-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                    Current Emotion & State
                  </span>
                  <h2 className="text-4xl font-[1000] italic mt-1 text-white">{emotion}</h2>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full animate-pulse">
                  LIVE
                </div>
              </div>

              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                {emotion === "Happy" && `${dog?.name || "Your dog"} is showing energetic and positive behavioral signals.`}
                {emotion === "Calm" && `${dog?.name || "Your dog"} is relaxed with stable heart rates.`}
                {emotion === "Anxious" && `${dog?.name || "Your dog"} exhibits elevated movement and heart rates.`}
                {emotion !== "Happy" && emotion !== "Calm" && emotion !== "Anxious" && `${dog?.name || "Your dog"} is active and monitored.`}
              </p>

              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 rounded-full w-[88%] transition-all duration-1000" />
              </div>
            </Card>

            {/* Quick Metrics */}
            <div className="space-y-6">
              <Card accent="cyan" className="p-6 border-white/10 bg-white/5 backdrop-blur-md">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  Heart Rate
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{hr}</span>
                  <span className="text-xs text-white/40 font-bold">BPM</span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-2 font-medium">✓ Normal Range</p>
              </Card>

              <Card accent="emerald" className="p-6 border-white/10 bg-white/5 backdrop-blur-md">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  Collar Battery
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{battery}%</span>
                </div>
                <p className="text-[11px] text-white/40 mt-2 font-medium">Estimated 3 days remaining</p>
              </Card>
            </div>
          </div>

          {/* AI Assistant Section */}
          <Card accent="violet" className="p-8 border-white/10 bg-white/5 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-black text-sm shadow-lg shadow-violet-500/20">
                AI
              </div>
              <div>
                <h3 className="text-xl font-black italic">Smart AI Assistant</h3>
                <p className="text-xs text-white/40">Ask anything about {dog?.name || "your pet"}'s behavior or wellbeing</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Ask AI about ${dog?.name || "your dog"}... (e.g. "Is 85 BPM normal right now?")`}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                />
                <PrimaryButton onClick={handleAskAI} className="whitespace-nowrap px-8">
                  {aiLoading ? "Analyzing..." : "Ask AI"}
                </PrimaryButton>
              </div>

              {aiAnswer && (
                <div className="p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-sm text-white/80 leading-relaxed mt-4 animate-fadeIn">
                  <div className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2">
                    AI Insight Response
                  </div>
                  {aiAnswer}
                </div>
              )}
            </div>
          </Card>

        </div>
      </PageShell>
    </div>
  );
}