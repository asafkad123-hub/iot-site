"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { PageShell, Card, Pill, PrimaryButton, SecondaryButton } from "../_components/ds";
import FamilyVideoWidget from "./FamilyVideoWidget";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { computeTrends } from "@/lib/trends";

const EMOTION_COLORS: Record<string, string> = {
    HAPPY: "#eab308", RELAXED: "#22c55e", ANGRY: "#ef4444", SAD: "#3b82f6", UNCERTAIN: "#71717a",
};

const SETTING_LABELS: Record<string, string> = {
    heroStatus: "Main Pet Status & Mood",
    aiAssistant: "AI Companion Chat",
    vitalsOverview: "Vitals & Biometrics Overview",
    barkDetection: "Live Bark Classifier",
};

function quadrantEmotion(v: number, a: number) {
    if (Math.hypot(v ?? 0, a ?? 0) < 0.2) return "UNCERTAIN";
    if (v >= 0 && a >= 0) return "HAPPY";
    if (v < 0 && a >= 0) return "ANGRY";
    if (v < 0 && a < 0) return "SAD";
    return "RELAXED";
}

function timeAgo(iso: string) {
    if (!iso) return "";
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

export default function FamilyPage() {
    const router = useRouter();

    const [dog, setDog] = useState<any>(null);
    const [motionData, setMotionData] = useState<any>(null);
    const [affectData, setAffectData] = useState<any>(null);
    const [affectHistory, setAffectHistory] = useState<any[]>([]);
    const [lastBark, setLastBark] = useState<any>(null);
    const [visionAnalysis, setVisionAnalysis] = useState<any>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [userQuery, setUserQuery] = useState("");
    const [isSendingQuery, setIsSendingQuery] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
        { role: "assistant", text: "Hello! I'm monitoring your pet in real-time. Ask me anything about their mood or health!" }
    ]);

    const [isLightMode, setIsLightMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [cardPrefs, setCardPrefs] = useState({
        heroStatus: true,
        aiAssistant: true,
        vitalsOverview: true,
        barkDetection: true,
    });

    const [editForm, setEditForm] = useState({ name: "", breed: "", weight: "", age: "" });

    const tColor = isLightMode ? "text-slate-900" : "text-white";
    const tMuted = isLightMode ? "text-slate-600" : "text-white/60";
    const borderBase = isLightMode ? "border-slate-200" : "border-white/10";
    const bgCardInt = isLightMode ? "bg-slate-100" : "bg-white/5";
    const bgInput = isLightMode ? "bg-white border-slate-300 text-slate-900 focus:border-violet-500" : "bg-black/50 border-white/20 text-white focus:border-violet-500";
    const pageBg = isLightMode ? "bg-slate-50" : "bg-[#05060b]";

    const getData = useCallback(async () => {
        if (isEditingProfile) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data: dogs } = await supabase.from("dogs").select("*")
            .eq("user_id", session.user.id)
            .order("is_active_wearer", { ascending: false })
            .order("updated_at", { ascending: false })
            .limit(1);

        const d = dogs?.[0];
        if (!d) return;

        setDog(d);
        setEditForm({
            name: d.name ?? "",
            breed: d.breed ?? "",
            weight: String(d.weight ?? ""),
            age: String(d.age ?? "")
        });

        const { data: motion } = await supabase.from("motion_data").select("*")
            .eq("dog_id", d.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (motion) setMotionData(motion);

        const { data: affect } = await supabase.from("affect_states").select("*")
            .eq("dog_id", d.id).order("created_at", { ascending: false }).limit(1000);
        if (affect && affect.length) {
            setAffectHistory(affect.reverse());
            setAffectData(affect[affect.length - 1]);
        }

        const { data: bark } = await supabase.from("affect_labels").select("*")
            .eq("dog_id", d.id).eq("source", "audio").order("created_at", { ascending: false }).limit(1).maybeSingle();
        setLastBark(bark ?? null);
    }, [router, isEditingProfile]);

    useAutoRefresh(getData, 3000, isEditingProfile);

    useEffect(() => {
        if (!dog?.id) return;
        const ch = supabase.channel(`rt-family-${dog.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "affect_states", filter: `dog_id=eq.${dog.id}` },
                (p) => {
                    setAffectData(p.new);
                    setAffectHistory((prev) => { const u = [...prev, p.new]; return u.length > 1000 ? u.slice(1) : u; });
                })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "motion_data", filter: `dog_id=eq.${dog.id}` },
                (p) => setMotionData(p.new))
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "affect_labels", filter: `dog_id=eq.${dog.id}` },
                (p) => { if (p.new?.source === "audio") setLastBark(p.new); })
            .subscribe();

        return () => { supabase.removeChannel(ch); };
    }, [dog?.id]);

    const handleSaveProfile = async () => {
        if (!dog?.id) return;
        const payload = {
            name: editForm.name,
            breed: editForm.breed,
            weight: parseFloat(editForm.weight) || 0,
            age: parseFloat(editForm.age) || 0,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from("dogs").update(payload).eq("id", dog.id);
        if (!error) {
            setDog({ ...dog, ...payload });
            setIsEditingProfile(false);
        } else {
            alert("Error updating profile: " + error.message);
        }
    };

    const handleSendChatMessage = async () => {
        if (!userQuery.trim() || isSendingQuery) return;

        const q = userQuery.trim();
        setUserQuery("");
        setIsSendingQuery(true);

        const updated = [...chatMessages, { role: "user" as const, text: q }];
        setChatMessages(updated);

        try {
            const trends = computeTrends(affectHistory);
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dog,
                    liveMetrics: affectData,
                    motion: motionData,
                    barkAnalysis: lastBark,
                    finalEmotion:
                        affectData?.predicted_emotion ||
                        quadrantEmotion(
                            affectData?.valence ?? 0,
                            affectData?.arousal ?? 0
                        ),
                    finalRussell: {
                        valence: affectData?.valence ?? null,
                        arousal: affectData?.arousal ?? null,
                    },
                    valenceReliable: affectData?.valence_reliable === true,
                    activeContext: null,
                    trends,
                    visionAnalysis,
                    messages: updated.map((msg) => ({
                        role: msg.role,
                        content: msg.text,
                    })),
                    isChat: true
                })
            });

            const contentType = res.headers.get("content-type");

            if (
                !contentType ||
                !contentType.includes("application/json")
            ) {
                const responseText = await res.text();

                console.error(
                    "Assistant endpoint returned non-JSON:",
                    responseText
                );

                throw new Error(
                    "The assistant server returned an invalid response."
                );
            }

            const data = await res.json();

            if (!res.ok || !data?.text?.trim()) {
                throw new Error(
                    data?.detail ||
                    data?.error ||
                    "Could not reach the AI service."
                );
            }

            setChatMessages([
                ...updated,
                {
                    role: "assistant",
                    text: data.text.trim(),
                },
            ]);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unknown assistant error.";

            console.error("Family AI assistant error:", err);

            setChatMessages([
                ...updated,
                {
                    role: "assistant",
                    text:
                        "I couldn't reach the AI service right now. " +
                        `Please try again in a moment. (${message})`,
                },
            ]);
        } finally {
            setIsSendingQuery(false);
        }
    };

    const currentEmotion = affectData?.predicted_emotion ||
        (affectData ? quadrantEmotion(affectData.valence ?? 0, affectData.arousal ?? 0) : "UNCERTAIN");

    const isBarkingNow = lastBark && (Date.now() - new Date(lastBark.created_at).getTime()) < 15000;

    return (
        <PageShell subtitle={`Family Mode • ${dog?.name || "Pet Feed"}`}>
            <div className={`min-h-screen ${pageBg} px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300`}>

                {/* Navigation & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <h1 className={`text-2xl font-black italic ${tColor}`}>Family Overview</h1>
                        <Pill tone="violet" label="Family Mode" />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push("/choosemode")}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${borderBase} ${bgCardInt} ${tColor} hover:opacity-80`}
                        >
                            <span>🔄</span> Switch Mode
                        </button>

                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition hover:bg-cyan-500/30"
                        >
                            ⚡ Pro Mode
                        </button>

                        <button
                            onClick={() => setIsLightMode(!isLightMode)}
                            className={`p-2 rounded-xl border text-xs transition ${borderBase} ${bgCardInt} ${tColor}`}
                        >
                            {isLightMode ? "🌙 Dark" : "☀️ Light"}
                        </button>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-xl border text-xs transition ${borderBase} ${bgCardInt} ${tColor}`}
                        >
                            ⚙️
                        </button>
                    </div>
                </div>

                {/* Customization Settings Drawer */}
                {showSettings && (
                    <div className="mb-6">
                        <Card accent="violet">
                            <h4 className={`text-sm font-bold mb-3 ${tColor}`}>Customize Family Widgets</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.keys(cardPrefs).map(key => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer text-xs">
                                        <input
                                            type="checkbox"
                                            checked={(cardPrefs as any)[key]}
                                            onChange={e => setCardPrefs({ ...cardPrefs, [key]: e.target.checked })}
                                            className="rounded accent-violet-500"
                                        />
                                        <span className={`font-medium ${tColor}`}>{SETTING_LABELS[key] || key}</span>
                                    </label>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- MODULE 1: Main Pet Hero Status --- */}
                {cardPrefs.heroStatus && (
                    <div className="mb-8">
                        <Card accent="emerald">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-4xl shadow-inner">
                                        🐶
                                    </div>
                                    <div>
                                        {!isEditingProfile ? (
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className={`text-3xl font-black ${tColor}`}>{dog?.name || "Your Dog"}</h2>
                                                    <button
                                                        onClick={() => setIsEditingProfile(true)}
                                                        className="text-xs text-violet-400 underline hover:text-violet-300"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                <p className={`text-sm ${tMuted}`}>{dog?.breed || "Unknown Breed"} • {dog?.age ? `${dog.age} Years Old` : ""}</p>
                                                <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1 inline-block">● Collar Connected ({dog?.collar_id || "No collar ID"})</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        className={`px-2 py-1 text-xs rounded border ${bgInput}`}
                                                        value={editForm.name}
                                                        placeholder="Name"
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    />
                                                    <input
                                                        className={`px-2 py-1 text-xs rounded border ${bgInput}`}
                                                        value={editForm.breed}
                                                        placeholder="Breed"
                                                        onChange={e => setEditForm({ ...editForm, breed: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        className={`px-2 py-1 text-xs rounded border ${bgInput}`}
                                                        value={editForm.age}
                                                        placeholder="Age"
                                                        onChange={e => setEditForm({ ...editForm, age: e.target.value })}
                                                    />
                                                    <button onClick={handleSaveProfile} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">Save</button>
                                                    <button onClick={() => setIsEditingProfile(false)} className="px-2 py-1 text-xs text-white/60">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center md:text-right">
                                    <div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Current Emotion</div>
                                    <div className="text-3xl font-black tracking-tight" style={{ color: EMOTION_COLORS[currentEmotion] || "#22c55e" }}>
                                        {currentEmotion}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- MODULE 2: AI Assistant Chat --- */}
                {cardPrefs.aiAssistant && (
                    <div className="mb-8">
                        <Card accent="violet">
                            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤖</span>
                                    <h3 className={`text-lg font-bold ${tColor}`}>AI Assistant Companion</h3>
                                </div>
                                <Pill tone="emerald" label="Live AI" />
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 p-2">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs sm:text-sm font-medium ${msg.role === "user"
                                                ? "bg-violet-600 text-white rounded-br-none"
                                                : `${bgCardInt} ${tColor} border ${borderBase} rounded-bl-none`
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ask anything about your dog's state, mood or trends..."
                                    className={`flex-1 p-2.5 rounded-xl border text-sm ${bgInput}`}
                                    value={userQuery}
                                    onChange={e => setUserQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSendChatMessage()}
                                />
                                <PrimaryButton onClick={handleSendChatMessage} disabled={isSendingQuery || !userQuery.trim()}>
                                    {isSendingQuery ? "Sending..." : "Send"}
                                </PrimaryButton>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Vision ML Video Analysis Widget */}
                <FamilyVideoWidget
                    onAnalysisComplete={setVisionAnalysis}
                />

                {/* --- MODULE 3: Vitals Overview --- */}
                {cardPrefs.vitalsOverview && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        <Card>
                            <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Heart Rate</div>
                            <div className={`text-2xl font-black ${tColor}`}>{affectData?.raw_hr != null ? `${affectData.raw_hr.toFixed(1)} BPM` : "--"}</div>
                        </Card>

                        <Card>
                            <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Oxygen (SpO2)</div>
                            <div className={`text-2xl font-black ${tColor}`}>{affectData?.spo2 != null ? `${affectData.spo2.toFixed(0)}%` : "--"}</div>
                        </Card>

                        <Card>
                            <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${tMuted}`}>HRV</div>
                            <div className={`text-2xl font-black ${tColor}`}>{affectData?.raw_rmssd != null ? `${affectData.raw_rmssd.toFixed(1)} ms` : "--"}</div>
                        </Card>

                        <Card>
                            <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Posture</div>
                            <div className={`text-2xl font-black capitalize ${tColor}`}>{affectData?.posture ?? "--"}</div>
                        </Card>
                    </div>
                )}

                {/* --- MODULE 4: Live Bark Detection --- */}
                {cardPrefs.barkDetection && (
                    <div>
                        <Card accent="violet">
                            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🔊</span>
                                    <h3 className={`text-lg font-bold ${tColor}`}>Bark Detection</h3>
                                </div>
                                <Pill
                                    tone={isBarkingNow ? "amber" : "zinc"}
                                    label={isBarkingNow ? "Barking Detected" : "Quiet"}
                                />
                            </div>

                            {lastBark ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border ${borderBase} ${bgCardInt}`}>
                                        <div className={`text-xs ${tMuted}`}>Bark Status</div>
                                        <div className={`text-lg font-bold mt-1 ${isBarkingNow ? "text-amber-400" : tColor}`}>
                                            {isBarkingNow ? "🔊 Active Barking" : "No Active Barking"}
                                        </div>
                                        {!isBarkingNow && (
                                            <div className={`text-xs mt-1 ${tMuted}`}>Last detected: {timeAgo(lastBark.created_at)}</div>
                                        )}
                                    </div>

                                    <div className={`p-4 rounded-xl border ${borderBase} ${bgCardInt}`}>
                                        <div className={`text-xs ${tMuted}`}>Bark Type</div>
                                        <div className={`text-lg font-bold capitalize mt-1 ${tColor}`}>
                                            {lastBark?.valence_label != null && lastBark?.arousal_label != null
                                                ? quadrantEmotion(lastBark.valence_label, lastBark.arousal_label)
                                                : "--"}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-xl text-xs text-center ${bgCardInt} ${tMuted}`}>
                                    No bark events recorded yet.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

            </div>
        </PageShell>
    );
}