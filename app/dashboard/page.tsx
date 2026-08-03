"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PageShell, Card, Pill, SecondaryButton, Field, PrimaryButton } from "../_components/ds";
import { computeTrends } from "@/lib/trends";
import FamilyVideoWidget from "../family/FamilyVideoWidget";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const EMOTION_COLORS: Record<string, string> = {
    HAPPY: "#eab308", RELAXED: "#22c55e", ANGRY: "#ef4444", SAD: "#3b82f6", UNCERTAIN: "#71717a",
};
const ANCHORS = [
    { name: "HAPPY", label: "Happy / playful", v: 0.7, a: 0.6 },
    { name: "RELAXED", label: "Calm / content", v: 0.7, a: -0.6 },
    { name: "ANGRY", label: "Anxious / agitated", v: -0.7, a: 0.6 },
    { name: "SAD", label: "Withdrawn / low", v: -0.6, a: -0.6 },
];

const ACTIVITY_PRIORS: Record<string, [number, number]> = {
    play: [0.75, 0.75], walk: [0.55, 0.55], meal: [0.65, 0.25], training: [0.45, 0.50],
    greeting: [0.70, 0.80], nap: [0.35, -0.75], sleep: [0.30, -0.85], rest: [0.30, -0.55],
    alone: [-0.45, -0.10], vet: [-0.65, 0.65], thunderstorm: [-0.75, 0.70], grooming: [-0.30, 0.30],
};
const KNOWN_CONTEXTS = Object.keys(ACTIVITY_PRIORS);

type Behaviour = { key: string; label: string; v: number; a: number; emotion: string };
const BEHAVIOURS: Record<string, Behaviour> = {
    play: { key: "play", label: "Playing / zoomies", v: 0.8, a: 0.8, emotion: "HAPPY" },
    greet: { key: "greet", label: "Excited / greeting", v: 0.6, a: 0.7, emotion: "HAPPY" },
    alert: { key: "alert", label: "Alert / watching something", v: 0.0, a: 0.5, emotion: "UNCERTAIN" },
    seek: { key: "seek", label: "Wants attention / follows me", v: 0.3, a: 0.3, emotion: "HAPPY" },
    relaxed: { key: "relaxed", label: "Relaxed / lounging", v: 0.5, a: -0.4, emotion: "RELAXED" },
    sleep: { key: "sleep", label: "Sleeping / deeply settled", v: 0.3, a: -0.7, emotion: "RELAXED" },
    pace: { key: "pace", label: "Restless / pacing / whining", v: -0.5, a: 0.5, emotion: "ANGRY" },
    hide: { key: "hide", label: "Scared / hiding / cowering", v: -0.8, a: 0.5, emotion: "ANGRY" },
    guard: { key: "guard", label: "Growling / tense / guarding", v: -0.7, a: 0.7, emotion: "ANGRY" },
    withdrawn: { key: "withdrawn", label: "Withdrawn / unusually still", v: -0.5, a: -0.5, emotion: "SAD" },
    uneasy: { key: "uneasy", label: "Uneasy / unsettled", v: -0.3, a: 0.0, emotion: "SAD" },
};

function behaviourOptions(a: any): Behaviour[] {
    const ar = a?.arousal ?? 0;
    const posture = (a?.posture ?? "").toString().toLowerCase();
    let keys: string[];
    if (ar >= 0.55) keys = ["play", "greet", "alert", "pace", "guard", "hide"];
    else if (ar >= 0.2) keys = ["alert", "seek", "greet", "pace", "uneasy"];
    else if (ar > -0.2) keys = ["relaxed", "seek", "alert", "uneasy", "withdrawn"];
    else keys = ["sleep", "relaxed", "withdrawn", "uneasy"];
    if (posture.includes("lying") || posture.includes("rest")) keys = keys.filter(k => !["play", "greet"].includes(k));
    const have = (set: string[]) => keys.some(k => set.includes(k));
    if (!have(["play", "greet", "relaxed", "seek", "sleep"])) keys.push("relaxed");
    if (!have(["pace", "hide", "guard", "withdrawn", "uneasy"])) keys.push(ar >= 0.2 ? "pace" : "withdrawn");
    return Array.from(new Set(keys)).slice(0, 6).map(k => BEHAVIOURS[k]);
}

function quadrantEmotion(v: number, a: number) {
    if (Math.hypot(v ?? 0, a ?? 0) < 0.2) return "UNCERTAIN";
    if (v >= 0 && a >= 0) return "HAPPY";
    if (v < 0 && a >= 0) return "ANGRY";
    if (v < 0 && a < 0) return "SAD";
    return "RELAXED";
}

function arousalBand(a: number | null | undefined) {
    if (a == null) return "—";
    if (a <= -0.55) return "Deep calm";
    if (a <= -0.2) return "Calm";
    if (a < 0.2) return "Settled";
    if (a < 0.5) return "Alert";
    if (a < 0.75) return "Aroused";
    return "High energy";
}

function recognitionState(a: any) {
    const src: string = (a?.valence_source ?? "").toString();
    if (a?.valence_reliable && (src.includes("recall") || src.includes("human")))
        return { tag: "Recognised", tone: "emerald" as const, note: "matches a state you've labelled before" };
    if (a?.valence_reliable && src.includes("audio"))
        return { tag: "Heard", tone: "emerald" as const, note: "confirmed by a recent vocalisation" };
    if (a?.valence_reliable)
        return { tag: "Confident", tone: "emerald" as const, note: "valence is validated for this state" };
    return { tag: "Learning", tone: "amber" as const, note: "still learning this dog's valence — reading body & energy for now" };
}

function describeState(a: any, name: string) {
    if (!a) return `${name} — waiting for data`;
    const posture = (a.posture ?? "").toString();
    const band = arousalBand(a.arousal).toLowerCase();
    const drive = a.panksepp_state && a.panksepp_state !== "CALIBRATING" ? a.panksepp_state.toLowerCase() : null;
    const trusted = a.valence_reliable === true;
    const emo = trusted && a.predicted_emotion && a.predicted_emotion !== "UNCERTAIN"
        ? a.predicted_emotion.toLowerCase() : null;
    const bits: string[] = [];
    if (posture) bits.push(posture);
    bits.push(band);
    if (drive) bits.push(`in a ${drive} drive`);
    let s = bits.join(", ");
    if (emo) s += ` — reads as ${emo}`;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function sessionTrends(history: any[]) {
    if (!history || history.length < 5) return [] as { posture: string; band: string; pct: number; n: number }[];
    const counts: Record<string, number> = {};
    for (const h of history) {
        const key = `${(h.posture ?? "?")}·${arousalBand(h.arousal)}`;
        counts[key] = (counts[key] ?? 0) + 1;
    }
    const total = history.length;
    return Object.entries(counts)
        .sort((x, y) => y[1] - x[1])
        .slice(0, 3)
        .map(([key, n]) => {
            const [posture, band] = key.split("·");
            return { posture, band, pct: Math.round((n / total) * 100), n };
        });
}

function timeAgo(iso: string) {
    if (!iso) return "";
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

function fmtDuration(start: string, end: string | null) {
    if (!start) return "";
    const endT = end ? new Date(end).getTime() : Date.now();
    const s = Math.max(0, Math.floor((endT - new Date(start).getTime()) / 1000));
    const m = Math.floor(s / 60), sec = s % 60;
    if (m < 1) return `${sec}s`;
    if (m < 60) return `${m}m ${sec}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function evaluatePhysiology(data: any, isSelfTest: boolean) {
    const alerts: any[] = [];
    let status: "normal" | "warning" | "critical" = "normal";

    if (!data) return { alerts, status };

    const limits = isSelfTest
        ? { hrHigh: 120, hrLow: 40, spo2Low: 94 }
        : { hrHigh: 160, hrLow: 50, spo2Low: 93 };

    if (data.raw_hr > limits.hrHigh) {
        alerts.push(`Elevated Heart Rate (${data.raw_hr.toFixed(0)} BPM)`);
        status = "warning";
    } else if (data.raw_hr < limits.hrLow && data.raw_hr > 0) {
        alerts.push(`Bradycardia Alert (${data.raw_hr.toFixed(0)} BPM)`);
        status = "warning";
    }

    if (data.spo2 != null && data.spo2 < limits.spo2Low && data.spo2 > 0) {
        alerts.push(`Low Blood Oxygen (${data.spo2.toFixed(0)}%)`);
        status = "critical";
    }

    if (data.rr_count != null && data.rr_count > 40) {
        alerts.push(`Elevated Respiratory Rate`);
        status = status === "critical" ? "critical" : "warning";
    }

    if (data.wellbeing_deviation != null && data.wellbeing_deviation > 0.7) {
        alerts.push(`High Wellbeing Deviation`);
        status = status === "critical" ? "critical" : "warning";
    }

    return { alerts, status };
}

export default function DashboardPage() {
    const [dog, setDog] = useState<any>(null);
    const [motionData, setMotionData] = useState<any>(null);
    const [affectData, setAffectData] = useState<any>(null);
    const [affectHistory, setAffectHistory] = useState<any[]>([]);
    const [pendingQuery, setPendingQuery] = useState<any>(null);
    const [showEmotionFix, setShowEmotionFix] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [newActivityLabel, setNewActivityLabel] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [lastBark, setLastBark] = useState<any>(null);
    const [barks, setBarks] = useState<any[]>([]);
    const [currentBarkIndex, setCurrentBarkIndex] = useState(0);
    const [visionAnalysis, setVisionAnalysis] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: "", breed: "", weight: "", age: "", collar_id: "", species: "dog" });

    const [trailActivity, setTrailActivity] = useState<any>(null);
    const [trailPoints, setTrailPoints] = useState<any[]>([]);
    const [trailLoading, setTrailLoading] = useState(false);
    const [taughtCount, setTaughtCount] = useState<number | null>(null);
    const [labelToast, setLabelToast] = useState<string | null>(null);

    const [isLightMode, setIsLightMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showAiDrawer, setShowAiDrawer] = useState(false);
    const [streamLatency, setStreamLatency] = useState<number | null>(null);
    const [cardPrefs, setCardPrefs] = useState({ physio: true, ai: true, vitals: true, chart: true, context: true, recent: true, bark: true, multiBark: true });

    const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant", content: string }[]>([]);
    const [aiChatInput, setAiChatInput] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiUpdatedAt, setAiUpdatedAt] = useState<number | null>(null);

    const [activeCollars, setActiveCollars] = useState<any[]>([]);
    const [showCollarBanner, setShowCollarBanner] = useState(false);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    const router = useRouter();

    const tColor = isLightMode ? "text-slate-900" : "text-white";
    const tMuted = isLightMode ? "text-slate-600" : "text-white/60";
    const tMutedAlt = isLightMode ? "text-slate-400" : "text-white/40";
    const borderBase = isLightMode ? "border-slate-200" : "border-white/10";
    const bgCardInt = isLightMode ? "bg-slate-100" : "bg-white/5";
    const bgInput = isLightMode ? "bg-white border-slate-300 text-slate-900 focus:border-violet-500" : "bg-black/50 border-white/20 text-white focus:border-emerald-500";
    const pageBg = isLightMode ? "bg-slate-50" : "bg-transparent";

    const loadActivities = async (dogId: string) => {
        const { data: acts } = await supabase.from("activity_sessions").select("*")
            .eq("dog_id", dogId).order("created_at", { ascending: false }).limit(8);
        setRecentActivities(acts ?? []);
        setActiveSession((acts ?? []).find((a: any) => a.status === "recording") ?? null);
    };

    const calculateLatency = (createdAtStr: string) => {
        if (!createdAtStr) return;
        const packetTime = new Date(createdAtStr).getTime();
        const now = Date.now();
        const diff = Math.max(12, now - packetTime);
        setStreamLatency(diff);
    };

    const getData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const [
            { data: globalCollars },
            { data: statuses },
            { data: dogs }
        ] = await Promise.all([
            supabase.rpc("get_global_collars"),
            supabase.from("device_status").select("device_id, status"),
            supabase.from("dogs").select("*").eq("user_id", session.user.id).order("is_active_wearer", { ascending: false }).order("updated_at", { ascending: false }).limit(1)
        ]);

        if (globalCollars) {
            const merged = globalCollars.map((c: any) => {
                const stat = statuses?.find((s: any) => s.device_id === c.collar_id);
                return { ...c, status: stat?.status || "offline" };
            });
            setActiveCollars(merged);
        }

        const d = dogs?.[0];
        if (!d) return;

        setDog(d);
        setEditForm({
            name: d.name ?? "", breed: d.breed ?? "", weight: String(d.weight ?? ""),
            age: String(d.age ?? ""), collar_id: d.collar_id ?? "", species: d.species ?? "dog"
        });

        const motionReq = supabase.from("motion_data").select("*").eq("dog_id", d.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const affectReq = supabase.from("affect_states").select("*").eq("dog_id", d.id).order("created_at", { ascending: false }).limit(1000);
        const queryReq = supabase.from("active_queries").select("*").eq("dog_id", d.id).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
        const barkReq = supabase.from("affect_labels").select("*").eq("dog_id", d.id).eq("source", "audio").order("created_at", { ascending: false }).limit(5);
        const countReq = supabase.from("affect_labels").select("*", { count: "exact", head: true }).eq("dog_id", d.id);

        const [
            ,
            { data: motion },
            { data: affect },
            { data: q },
            { data: barksData },
            { count }
        ] = await Promise.all([
            loadActivities(d.id),
            motionReq,
            affectReq,
            queryReq,
            barkReq,
            countReq
        ]);

        if (motion) setMotionData(motion);
        if (affect && affect.length) {
            setAffectHistory(affect.reverse());
            setAffectData(affect[affect.length - 1]);
            calculateLatency(affect[affect.length - 1].created_at);
        }
        setPendingQuery(q ?? null);
        if (barksData && barksData.length) {
            setBarks(barksData);
            setLastBark(barksData[0]);
        }
        setTaughtCount(count ?? 0);
    };

    useEffect(() => { getData(); }, []);

    useEffect(() => {
        const statusCh = supabase.channel("global-device-status")
            .on("postgres_changes", { event: "*", schema: "public", table: "device_status" }, (p) => {
                const payload: any = p.new;
                if (payload?.device_id) {
                    setActiveCollars((prev) => prev.map((c) =>
                        c.collar_id === payload.device_id ? { ...c, status: payload.status } : c
                    ));
                }
            }).subscribe();
        return () => { supabase.removeChannel(statusCh); };
    }, []);

    useEffect(() => {
        if (!dog?.id) return;
        const ch = supabase.channel(`rt-${dog.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "affect_states", filter: `dog_id=eq.${dog.id}` },
                (p) => {
                    setAffectData(p.new);
                    calculateLatency(p.new.created_at);
                    setAffectHistory((prev) => { const u = [...prev, p.new]; return u.length > 1000 ? u.slice(1) : u; });
                })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "motion_data", filter: `dog_id=eq.${dog.id}` },
                (p) => setMotionData(p.new))
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "active_queries", filter: `dog_id=eq.${dog.id}` },
                (p) => { if (p.new.status === "pending") setPendingQuery(p.new); })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "affect_labels", filter: `dog_id=eq.${dog.id}` },
                (p) => {
                    if (p.new.source === "audio") {
                        setBarks((prev) => [p.new, ...prev].slice(0, 5));
                        setLastBark(p.new);
                        setCurrentBarkIndex(0);
                    }
                })
            .on("postgres_changes", { event: "*", schema: "public", table: "activity_sessions", filter: `dog_id=eq.${dog.id}` },
                () => loadActivities(dog.id))
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [dog?.id]);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [aiMessages, showAiDrawer]);

    const sendDeviceCommand = async (command: "START" | "STOP" | "POWEROFF") => {
        if (command === "POWEROFF") {
            if (!window.confirm("Are you sure you want to safely shut down the collar? You will need to physically turn it back on.")) return;
        }
        if (!dog?.collar_id) return;
        await supabase.from("device_commands").insert({ device_id: dog.collar_id, command, processed: false });
    };

    const dismissQuery = async () => {
        if (!pendingQuery) return;
        await supabase.from("active_queries").update({ status: "dismissed", answered_at: new Date().toISOString() }).eq("id", pendingQuery.id);
        setPendingQuery(null);
    };

    const labelNow = async (b: Behaviour) => {
        if (!affectData?.features || !dog?.id) return;
        const payload = {
            answer_valence: b.v, answer_arousal: b.a, answer_label: b.emotion,
            reason: `user_behaviour:${b.key}`, answered_at: new Date().toISOString(),
        };
        if (pendingQuery) {
            await supabase.from("active_queries").update({ status: "answered", ...payload }).eq("id", pendingQuery.id);
            setPendingQuery(null);
        } else {
            await supabase.from("active_queries").insert({
                dog_id: dog.id, features: affectData.features,
                valence_est: affectData.valence ?? 0, arousal_est: affectData.arousal ?? 0,
                predicted_emotion: affectData.predicted_emotion ?? null, status: "answered", ...payload,
            });
        }
        setTaughtCount((c) => (c ?? 0) + 1);
        setLabelToast(`Got it — noting "${b.label.toLowerCase()}". I'll recognise this state next time.`);
        setTimeout(() => setLabelToast(null), 3500);
    };

    const correctEmotion = async (anchor: typeof ANCHORS[number]) => {
        if (!affectData?.features || !dog?.id) return;
        await supabase.from("active_queries").insert({
            dog_id: dog.id, features: affectData.features,
            valence_est: affectData.valence ?? 0, arousal_est: affectData.arousal ?? 0,
            predicted_emotion: affectData.predicted_emotion ?? null,
            reason: "user_emotion_correction", status: "answered",
            answer_valence: anchor.v, answer_arousal: anchor.a,
            answer_label: anchor.name, answered_at: new Date().toISOString(),
        });
        setTaughtCount((c) => (c ?? 0) + 1);
        setShowEmotionFix(false);
        setLabelToast(`Emotion corrected to ${anchor.name.toLowerCase()}.`);
        setTimeout(() => setLabelToast(null), 3500);
    };

    const openActivityTrail = async (activity: any) => {
        if (!dog?.id) return;
        setTrailActivity(activity); setTrailLoading(true); setTrailPoints([]);
        const startT = activity.start_time || activity.created_at;
        const endT = activity.end_time || new Date().toISOString();
        const { data } = await supabase.from("affect_states")
            .select("valence,arousal,predicted_emotion,created_at,posture,panksepp_state")
            .eq("dog_id", dog.id).gte("created_at", startT).lte("created_at", endT)
            .order("created_at", { ascending: true }).limit(3000);
        setTrailPoints(data ?? []); setTrailLoading(false);
    };
    const closeActivityTrail = () => { setTrailActivity(null); setTrailPoints([]); };

    const startActivity = async () => {
        if (!newActivityLabel || !dog?.id) return;
        await supabase.from("activity_sessions")
            .insert({ dog_id: dog.id, activity_label: newActivityLabel, status: "recording" });
        setNewActivityLabel("");
        loadActivities(dog.id);
    };

    const stopActivity = async () => {
        if (!activeSession) return;
        await supabase.from("activity_sessions").update({ status: "completed", end_time: new Date().toISOString() }).eq("id", activeSession.id);
        loadActivities(dog.id);
    };

    const handleSaveProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const payload: any = {
            user_id: session.user.id, name: editForm.name, breed: editForm.breed,
            species: editForm.species, weight: parseFloat(editForm.weight), age: parseInt(editForm.age),
            collar_id: editForm.collar_id === "" ? null : editForm.collar_id, is_active_wearer: true
        };

        if (dog?.id) payload.id = dog.id;

        const { error } = await supabase.from("dogs").upsert(payload);
        if (!error) { setIsEditing(false); getData(); } else alert("Database error: " + error.message);
    };

    const currentCollar = activeCollars.find((c) => c.collar_id === dog?.collar_id);
    const isConnected = currentCollar
        ? currentCollar.status === "online" || currentCollar.status === "no_skin_contact"
        : Boolean(affectData || motionData);

    const valenceReliable = affectData?.valence_reliable === true;
    const effDim = affectData?.va_effective_dim;
    const well = affectData?.wellbeing_deviation;
    const isSelfTest = dog?.species === "human";

    const activeBark = barks[currentBarkIndex];
    const barkEmotion = activeBark ? quadrantEmotion(activeBark.valence_label, activeBark.arousal_label) : null;
    const activeCtxKey = activeSession?.activity_label?.trim().toLowerCase();
    const activeCtxPrior = activeCtxKey ? ACTIVITY_PRIORS[activeCtxKey] : null;

    const physio = evaluatePhysiology(affectData, isSelfTest);

    const askAI = async (userMessage?: string) => {
        if (!affectData || aiLoading) return;
        setAiLoading(true); setAiError(null);

        const updatedMessages = [...aiMessages];
        if (userMessage) {
            updatedMessages.push({ role: "user", content: userMessage });
            setAiMessages(updatedMessages);
        }

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
                    valenceReliable,
                    activeContext: activeSession?.activity_label ?? null,
                    trends,
                    visionAnalysis,
                    messages: updatedMessages,
                    isChat: true,
                }),
            });
            const data = await res.json();
            if (data?.text) {
                setAiMessages([...updatedMessages, { role: "assistant", content: data.text }]);
                setAiUpdatedAt(Date.now());
            }
            else setAiError(data?.detail || "The AI service didn't return a response. Please try again.");
        } catch (e: any) {
            setAiError(String(e?.message ?? e) + " — please try again in a moment.");
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (!affectData) return;
        const COOLDOWN_MS = 90_000;
        if (aiUpdatedAt && Date.now() - aiUpdatedAt < COOLDOWN_MS) return;

        if (aiMessages.length === 0) {
            askAI();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [affectData?.id]);

    const handleSendChat = () => {
        if (!aiChatInput.trim()) return;
        askAI(aiChatInput);
        setAiChatInput("");
    };

    return (
        <PageShell subtitle={isSelfTest ? "Self-Test Mode" : "Live Telemetry"}
            rightSlot={<SecondaryButton onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}>Logout</SecondaryButton>}>

            <div className={`mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 transition-colors duration-300 ${pageBg} rounded-xl mt-4 relative`}>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Pill tone="cyan" label="Pro Mode" />
                            <button
                                onClick={() => router.push("/family")}
                                className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold transition hover:bg-violet-500/30 flex items-center gap-1 cursor-pointer"
                            >
                                <span>🐾</span> Family Mode
                            </button>
                            <button
                                onClick={() => router.push("/choosemode")}
                                className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold transition hover:bg-white/20 cursor-pointer"
                            >
                                🔄 Switch Mode
                            </button>
                        </div>
                        <h2 className={`text-4xl sm:text-6xl font-black tracking-tighter ${tColor}`}>{(dog?.name || "Subject") + "'s Status"}</h2>
                        {isSelfTest && <span className="text-xs text-amber-500 uppercase tracking-widest font-bold">Human self-test · audio dormant · weak labels + your HRFL drive learning</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <SecondaryButton onClick={() => sendDeviceCommand("START")} className="bg-emerald-600/20 text-emerald-600 dark:text-emerald-500 border-emerald-500/50 hover:bg-emerald-600 hover:text-white">▶ Start</SecondaryButton>
                        <SecondaryButton onClick={() => sendDeviceCommand("STOP")} className="bg-amber-600/20 text-amber-600 dark:text-amber-500 border-amber-500/50 hover:bg-amber-600 hover:text-white mr-2">⏸ Stop</SecondaryButton>
                        <SecondaryButton onClick={() => sendDeviceCommand("POWEROFF")} className="bg-red-600/20 text-red-600 dark:text-red-500 border-red-500/50 hover:bg-red-600 hover:text-white mr-2">⏻ Power Off</SecondaryButton>
                        <SecondaryButton onClick={() => setShowCollarBanner(!showCollarBanner)}>{showCollarBanner ? "Hide Collars" : "📡 Active Collars"}</SecondaryButton>
                        <SecondaryButton onClick={() => setShowAiDrawer(!showAiDrawer)} className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">🐾 AI Assistant</SecondaryButton>
                        <SecondaryButton onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit Profile"}</SecondaryButton>
                        <SecondaryButton onClick={() => setShowSettings(!showSettings)}>{showSettings ? "Hide Settings" : "⚙️ Settings"}</SecondaryButton>

                        {/* UPDATED: Stream active status badge with dynamic latency reading */}
                        <Pill
                            tone={isConnected ? "emerald" : "amber"}
                            label={
                                isConnected
                                    ? `STREAM ACTIVE ${streamLatency !== null ? `(${streamLatency}ms)` : ""}`
                                    : "AWAITING TELEMETRY"
                            }
                        />
                    </div>
                </div>

                {showCollarBanner && (
                    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
                        <Card accent="violet">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📡</span>
                                    <h3 className={`text-lg font-bold ${tColor}`}>System Active Collars</h3>
                                </div>
                                <button onClick={() => setShowCollarBanner(false)} className={`text-xs uppercase tracking-widest font-bold ${tMutedAlt} hover:text-violet-500 transition-colors`}>Close</button>
                            </div>
                            {activeCollars.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {activeCollars.map((c, i) => {
                                        let dotClass = "bg-red-500";
                                        let textClass = "text-red-600 dark:text-red-400 font-bold";
                                        let label = "OFFLINE";

                                        if (c.status === "online") {
                                            dotClass = "bg-emerald-500 animate-pulse";
                                            textClass = "text-emerald-600 dark:text-emerald-400 font-bold";
                                            label = "ONLINE";
                                        } else if (c.status === "no_skin_contact") {
                                            dotClass = "bg-amber-500 animate-pulse";
                                            textClass = "text-amber-600 dark:text-amber-400 font-bold";
                                            label = "ONLINE (NO SKIN CONTACT)";
                                        }

                                        return (
                                            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${borderBase} ${bgCardInt}`}>
                                                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${dotClass}`}></div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${tColor}`}>{c.name || "Unknown Profile"}</span>
                                                    <span className={`text-[10px] font-mono uppercase tracking-widest ${tMuted}`}>
                                                        USER: {c.user_id?.split('-')[0]} · {c.collar_id} · <span className={textClass}>{label}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className={`text-sm ${tMuted}`}>No collars are currently assigned to any users in the system.</p>
                            )}
                        </Card>
                    </div>
                )}

                {showSettings && (
                    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
                        <Card accent="violet">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <h3 className={`text-lg font-bold mb-4 ${tColor}`}>Appearance</h3>
                                    <button
                                        onClick={() => setIsLightMode(!isLightMode)}
                                        className={`px-4 py-3 rounded-lg border font-bold transition-colors w-full text-left flex justify-between items-center ${isLightMode ? 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300' : 'bg-white/10 border-white/20 text-white hover:bg-white/15'}`}
                                    >
                                        <span>{isLightMode ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
                                        <span className="text-sm font-normal opacity-70">Click to toggle</span>
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-lg font-bold mb-4 ${tColor}`}>Dashboard Modules</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(cardPrefs).map(([key, isVisible]) => (
                                            <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isVisible ? borderBase : 'border-transparent'} ${bgCardInt}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isVisible}
                                                    onChange={(e) => setCardPrefs({ ...cardPrefs, [key]: e.target.checked })}
                                                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 bg-transparent"
                                                />
                                                <span className={`text-sm font-bold ${tColor}`}>{key}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {!isEditing && barks.length > 0 && cardPrefs.bark && (
                    <div className="mb-8">
                        <Card accent="violet">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🔊</span>
                                    <h3 className={`text-xl font-bold ${tColor}`}>
                                        {cardPrefs.multiBark ? "Recent Barks Heard" : "Last Bark Heard"}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    {cardPrefs.multiBark && barks.length > 1 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentBarkIndex(Math.min(barks.length - 1, currentBarkIndex + 1))}
                                                disabled={currentBarkIndex === barks.length - 1}
                                                className={`px-3 py-1 rounded-lg border ${borderBase} hover:bg-white/10 disabled:opacity-30 transition-all font-bold`}
                                            >←</button>
                                            <span className={`text-xs ${tMuted}`}>{currentBarkIndex + 1} of {barks.length}</span>
                                            <button
                                                onClick={() => setCurrentBarkIndex(Math.max(0, currentBarkIndex - 1))}
                                                disabled={currentBarkIndex === 0}
                                                className={`px-3 py-1 rounded-lg border ${borderBase} hover:bg-white/10 disabled:opacity-30 transition-all font-bold`}
                                            >→</button>
                                        </div>
                                    )}
                                    <span className={`text-xs uppercase tracking-widest font-bold ${tMutedAlt}`}>{timeAgo(activeBark?.created_at || "")}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                <div className="rounded-xl border p-3" style={{ borderColor: (EMOTION_COLORS[barkEmotion ?? "UNCERTAIN"] || "#888") + "55", background: (EMOTION_COLORS[barkEmotion ?? "UNCERTAIN"] || "#888") + "12" }}>
                                    <div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Emotion</div>
                                    <div className="text-2xl font-black" style={{ color: EMOTION_COLORS[barkEmotion ?? "UNCERTAIN"] || (isLightMode ? '#000' : '#fff') }}>{barkEmotion ?? "--"}</div>
                                </div>
                                <div className={`rounded-xl border p-3 ${borderBase} ${bgCardInt}`}><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Valence</div><div className={`text-2xl font-black ${tColor}`}>{activeBark?.valence_label?.toFixed(2) ?? "--"}</div></div>
                                <div className={`rounded-xl border p-3 ${borderBase} ${bgCardInt}`}><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Arousal</div><div className={`text-2xl font-black ${tColor}`}>{activeBark?.arousal_label?.toFixed(2) ?? "--"}</div></div>
                                <div className={`rounded-xl border p-3 ${borderBase} ${bgCardInt}`}><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Model Confidence</div><div className={`text-2xl font-black ${tColor}`}>{activeBark?.confidence != null ? (activeBark.confidence * 100).toFixed(0) + "%" : "--"}</div></div>
                                <div className={`rounded-xl border p-3 ${borderBase} ${bgCardInt}`}><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Exact Time</div><div className={`text-lg font-black ${tColor}`}>{activeBark?.created_at ? new Date(activeBark.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--"}</div></div>
                            </div>
                            <div className={`text-[10px] mt-3 uppercase tracking-wider ${tMutedAlt}`}>source: audio classifier · vocalisation is the only channel that carries valence directly</div>
                        </Card>
                    </div>
                )}

                {!isEditing && affectData && cardPrefs.physio && (
                    <div className="mb-8">
                        <Card accent={physio.status === "critical" ? "red" : physio.status === "warning" ? "amber" : "emerald"}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🩺</span>
                                    <h3 className={`text-xl font-bold ${tColor}`}>Medical & Physiological Status</h3>
                                </div>
                                <Pill
                                    tone={physio.status === "critical" ? "red" : physio.status === "warning" ? "amber" : "emerald"}
                                    label={physio.status === "normal" ? "ALL CLEAR" : physio.status.toUpperCase() + " DETECTED"}
                                />
                            </div>

                            {physio.status === "normal" ? (
                                <p className={`text-sm ${tMuted}`}>All raw vitals are currently reading within normal established baselines.</p>
                            ) : (
                                <div className="flex flex-col gap-2 mt-3">
                                    {physio.alerts.map((alert, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm font-bold">
                                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                            {alert}
                                        </div>
                                    ))}
                                    <div className={`text-[10px] mt-1 uppercase tracking-wider ${tMutedAlt}`}>Note: Hardware sensor artifacts can cause false positives. Check collar fit.</div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {!isEditing && affectData && (
                    <div className="mb-6">
                        <Card accent="amber">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className={`text-xs uppercase tracking-widest font-bold ${tMuted}`}>What {dog?.name || "they"} is doing right now</div>
                                    <Pill tone={recognitionState(affectData).tone} label={recognitionState(affectData).tag.toUpperCase()} />
                                </div>
                                <div className={`text-2xl sm:text-3xl font-black leading-tight ${tColor}`}>{describeState(affectData, dog?.name || "Subject")}</div>
                                <div className={`text-xs ${tMutedAlt}`}>{recognitionState(affectData).note}</div>
                                {sessionTrends(affectHistory).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1 items-center">
                                        {sessionTrends(affectHistory).map((t, i) => (
                                            <span key={i} className={`text-[11px] px-2 py-1 rounded-lg border ${borderBase} ${bgCardInt} ${tMuted}`}>
                                                {t.posture} · {t.band} <strong className={tColor}>{t.pct}%</strong>
                                            </span>
                                        ))}
                                        <span className={`text-[11px] ${tMutedAlt}`}>· recurring states this session</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {!isEditing && affectData && cardPrefs.vitals && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                        <Card accent="violet" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Heart Rate</div><div className={`text-3xl font-black ${tColor}`}>{affectData.raw_hr?.toFixed(1) ?? "--"} <span className={`text-sm font-normal ${tMuted}`}>BPM</span></div></Card>
                        <Card accent="violet" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>HRV (RMSSD)</div><div className={`text-3xl font-black ${tColor}`}>{affectData.raw_rmssd?.toFixed(1) ?? "--"} <span className={`text-sm font-normal ${tMuted}`}>ms</span></div></Card>
                        <Card accent="violet" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>SpO₂</div><div className={`text-3xl font-black ${tColor}`}>{affectData.spo2 != null ? affectData.spo2.toFixed(0) : "--"} <span className={`text-sm font-normal ${tMuted}`}>%</span></div></Card>
                        <Card accent="violet" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>RR Beats</div><div className={`text-3xl font-black ${tColor}`}>{affectData.rr_count != null ? affectData.rr_count.toFixed(0) : "--"}</div><div className={`text-[10px] mt-1 uppercase tracking-wider ${tMutedAlt}`}>beats in window</div></Card>
                        <Card accent="amber" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Posture</div><div className={`text-3xl font-black uppercase ${tColor}`}>{affectData.posture ?? "--"}</div></Card>
                        <Card accent="amber" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Restlessness</div><div className={`text-3xl font-black ${tColor}`}>{affectData.restlessness != null ? (affectData.restlessness * 100).toFixed(0) + "%" : "--"}</div><div className={`text-[10px] mt-1 uppercase tracking-wider ${tMutedAlt}`}>posture transition rate</div></Card>
                        <Card accent="amber" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Active Fraction</div><div className={`text-3xl font-black ${tColor}`}>{affectData.frac_active != null ? (affectData.frac_active * 100).toFixed(0) + "%" : "--"}</div><div className={`text-[10px] mt-1 uppercase tracking-wider ${tMutedAlt}`}>time spent moving</div></Card>
                        <Card accent="blue" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Panksepp</div><div className="text-3xl font-black text-blue-500 dark:text-blue-400 uppercase">{affectData.panksepp_state ?? "--"}</div></Card>
                        <Card accent="blue" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Read Strength</div><div className={`text-3xl font-black ${tColor}`}>{affectData.confidence != null ? (affectData.confidence * 100).toFixed(0) + "%" : "--"}</div><div className={`text-[10px] mt-1 uppercase tracking-wider ${tMutedAlt}`}>how clearly this reads</div></Card>
                        <Card accent="blue" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Dominance</div><div className={`text-3xl font-black ${tColor}`}>{affectData.dominance != null ? affectData.dominance.toFixed(2) : "--"}</div></Card>
                        <Card accent={well != null && well > 0.6 ? "amber" : "emerald"} className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Wellbeing Deviation</div><div className={`text-3xl font-black ${tColor}`}>{well != null ? (well * 100).toFixed(0) + "%" : "--"}</div>{well != null && well > 0.6 && <div className="text-[10px] text-amber-500 mt-1 uppercase tracking-wider">above normal calm baseline</div>}</Card>
                        <Card accent="blue" className="py-4"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>VA Effective Dim</div><div className={`text-3xl font-black ${tColor}`}>{effDim != null ? effDim.toFixed(2) : "--"} <span className={`text-sm font-normal ${tMuted}`}>/2</span></div></Card>
                        <Card accent="blue" className="py-4 lg:col-span-2"><div className={`text-xs uppercase tracking-widest font-bold mb-1 ${tMuted}`}>Affect (source: {affectData.valence_source ?? "--"})</div><div className="flex flex-wrap gap-4 items-center"><div><span className={`text-sm ${tMuted}`}>V:</span> <span className={`text-xl font-bold ${tColor}`}>{affectData.valence?.toFixed(2)}</span></div><div><span className={`text-sm ${tMuted}`}>A:</span> <span className={`text-xl font-bold ${tColor}`}>{affectData.arousal?.toFixed(2)}</span></div><Pill tone={valenceReliable ? "emerald" : "amber"} label={valenceReliable ? "VALENCE TRUSTED" : "VALENCE UNVALIDATED"} /></div></Card>
                    </div>
                )}

                {isEditing && (
                    <div className="mb-8"><Card accent="violet">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                            <Field label="Name" value={editForm.name} onChange={(v: any) => setEditForm({ ...editForm, name: v })} />
                            <Field label="Breed" value={editForm.breed} onChange={(v: any) => setEditForm({ ...editForm, breed: v })} />
                            <Field label="Age" type="number" value={editForm.age} onChange={(v: any) => setEditForm({ ...editForm, age: v })} />
                            <Field label="Weight" type="number" value={editForm.weight} onChange={(v: any) => setEditForm({ ...editForm, weight: v })} />
                            <Field label="Collar ID" value={editForm.collar_id} onChange={(v: any) => setEditForm({ ...editForm, collar_id: v })} />
                            <div>
                                <label className={`text-xs uppercase tracking-widest font-bold ${tMuted}`}>Species</label>
                                <select className={`mt-2 w-full rounded-lg p-3 text-sm focus:outline-none border ${bgInput}`} value={editForm.species} onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}>
                                    <option value="dog">Dog</option><option value="human">Human (self-test)</option>
                                </select>
                            </div>
                            <div className="lg:col-span-6 pt-2"><PrimaryButton onClick={handleSaveProfile}>Commit Changes</PrimaryButton></div>
                        </div>
                    </Card></div>
                )}

                {!isEditing && affectData && (cardPrefs.chart || cardPrefs.context) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                        {cardPrefs.chart && (
                            <div className={cardPrefs.context ? "lg:col-span-2" : "col-span-1 lg:col-span-3"}>
                                <Card accent="amber" className="h-full">
                                    <div className="flex justify-between items-center mb-4 gap-3">
                                        <h3 className={`text-xl font-bold ${tColor}`}>Russell Circumplex (V × A)</h3>
                                        <div className="px-4 py-2 rounded-lg font-black tracking-widest text-lg border" style={{ color: EMOTION_COLORS[affectData.predicted_emotion] || (isLightMode ? "#000" : "#fff"), borderColor: (EMOTION_COLORS[affectData.predicted_emotion] || (isLightMode ? "#000" : "#fff")) + "80", background: (EMOTION_COLORS[affectData.predicted_emotion] || (isLightMode ? "#000" : "#fff")) + "1a" }}>{(!affectData.predicted_emotion || affectData.predicted_emotion === "UNCERTAIN") ? arousalBand(affectData.arousal).toUpperCase() : affectData.predicted_emotion}</div>
                                    </div>
                                    <div className={`w-full rounded-xl overflow-hidden border p-2 ${bgCardInt} ${borderBase}`}>
                                        <Plot data={[
                                            { x: ANCHORS.map(a => a.v), y: ANCHORS.map(a => a.a), text: ANCHORS.map(a => a.name), type: "scatter", mode: "markers+text", textposition: "top center", textfont: { color: isLightMode ? "#64748b" : "#777", size: 11 }, hoverinfo: "text", marker: { size: 14, symbol: "cross", color: ANCHORS.map(a => EMOTION_COLORS[a.name]) } },
                                            { x: affectHistory.map(d => d.valence), y: affectHistory.map(d => d.arousal), type: "scatter", mode: "lines+markers", line: { color: isLightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)", width: 1 }, marker: { size: 5, opacity: 0.7, color: affectHistory.map(d => EMOTION_COLORS[d.predicted_emotion] || "#888") }, hoverinfo: "x+y" },
                                            ...(activeCtxPrior ? [{ x: [activeCtxPrior[0]], y: [activeCtxPrior[1]], type: "scatter", mode: "markers+text", text: [activeCtxKey + " (context)"], textposition: "bottom center", textfont: { color: "#a78bfa", size: 11 }, marker: { size: 16, symbol: "star", color: "#a78bfa", line: { color: isLightMode ? "#000" : "#fff", width: 1 } }, hoverinfo: "text" }] : []),
                                            { x: [affectData.valence], y: [affectData.arousal], type: "scatter", mode: "markers", marker: { size: 18, color: isLightMode ? "#0f172a" : "#fff", symbol: "diamond", line: { color: isLightMode ? "#fff" : "#000", width: 1 } }, hoverinfo: "x+y" },
                                        ] as any}
                                            layout={{
                                                autosize: true, height: 460, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: isLightMode ? "#0f172a" : "#fff" }, showlegend: false,
                                                xaxis: { title: "Valence", range: [-1.1, 1.1], zeroline: true, zerolinecolor: isLightMode ? "#cbd5e1" : "#555", gridcolor: isLightMode ? "#e2e8f0" : "#222" },
                                                yaxis: { title: "Arousal", range: [-1.1, 1.1], zeroline: true, zerolinecolor: isLightMode ? "#cbd5e1" : "#555", gridcolor: isLightMode ? "#e2e8f0" : "#222", scaleanchor: "x" },
                                                margin: { l: 50, r: 20, b: 50, t: 10 }
                                            } as any}
                                            useResizeHandler style={{ width: "100%", height: "100%" }} />
                                    </div>
                                    {!valenceReliable && (
                                        <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg p-3">
                                            Valence (the good/bad axis) is still learning for this dog, so the side-to-side position is a guess. What he&apos;s doing — posture, energy level, and the wellbeing signal — is reliable. Tell the system how he feels when it asks, and it will recognise that state next time.
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {cardPrefs.context && (
                            <div className="flex flex-col gap-6">
                                <Card accent="emerald">
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                        <h3 className={`text-lg font-bold ${tColor}`}>What is {dog?.name || "he"} doing right now?</h3>
                                        {taughtCount != null && <span className={`text-[11px] ${tMutedAlt}`}>{taughtCount} taught</span>}
                                    </div>
                                    {pendingQuery ? (
                                        <p className="text-sm mb-3 text-amber-600 dark:text-amber-400">
                                            <span className="relative inline-flex h-2 w-2 mr-1 align-middle"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
                                            I&apos;m unsure here (guessing <strong>{pendingQuery.predicted_emotion}</strong>) — telling me what he&apos;s doing helps most.
                                        </p>
                                    ) : (
                                        <p className={`text-sm mb-3 ${tMuted}`}>Describe what you see — the system maps the behaviour to how he feels and recognises this state next time.</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {behaviourOptions(affectData).map((b) => (
                                            <button key={b.key} onClick={() => labelNow(b)} disabled={!affectData?.features}
                                                className="px-3 py-2 rounded-lg text-xs font-bold border transition hover:scale-[1.02] disabled:opacity-40"
                                                style={{ color: EMOTION_COLORS[b.emotion] || (isLightMode ? "#334155" : "#ddd"), borderColor: (EMOTION_COLORS[b.emotion] || "#888") + "66", background: (EMOTION_COLORS[b.emotion] || "#888") + "14" }}>
                                                {b.label}
                                            </button>
                                        ))}
                                    </div>
                                    {labelToast && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{labelToast}</div>}
                                    {pendingQuery && <button onClick={dismissQuery} className={`text-xs mt-2 underline ${tMutedAlt}`}>not sure / skip</button>}

                                    <div className={`mt-3 pt-3 border-t ${borderBase}`}>
                                        {!showEmotionFix ? (
                                            <button onClick={() => setShowEmotionFix(true)} className={`text-xs underline ${tMutedAlt} hover:opacity-100`}>
                                                Emotion label looks wrong? Correct it directly →
                                            </button>
                                        ) : (
                                            <div>
                                                <div className={`text-[11px] uppercase tracking-widest font-bold mb-2 ${tMuted}`}>Set the emotion directly (currently {affectData.predicted_emotion || "—"})</div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {ANCHORS.map((opt) => (
                                                        <button key={opt.name} onClick={() => correctEmotion(opt)}
                                                            className="rounded-lg border px-2 py-2 text-xs font-bold hover:scale-[1.02] transition-transform"
                                                            style={{ color: EMOTION_COLORS[opt.name], borderColor: EMOTION_COLORS[opt.name] + "66", background: EMOTION_COLORS[opt.name] + "14" }}>
                                                            {opt.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button onClick={() => setShowEmotionFix(false)} className={`text-xs mt-2 underline ${tMutedAlt}`}>cancel</button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                                <Card accent="violet" className="flex-1">
                                    <h3 className={`text-lg font-bold mb-3 ${tColor}`}>Context</h3>
                                    <p className={`text-xs mb-3 ${tMuted}`}>Tagging activity helps label calm moments the system can&apos;t hear.</p>
                                    {activeSession ? (
                                        <div className="bg-violet-100 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/30 p-4 rounded-xl text-center">
                                            <div className="text-xs text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">Recording context</div>
                                            <div className={`text-lg font-black mb-1 ${tColor}`}>{activeSession.activity_label}</div>
                                            <div className={`text-[10px] mb-4 uppercase tracking-wider ${tMutedAlt}`}>{activeCtxPrior ? `learning prior V${activeCtxPrior[0].toFixed(2)} A${activeCtxPrior[1].toFixed(2)}` : "logged only — not a recognised keyword"}</div>
                                            <PrimaryButton onClick={stopActivity} className="w-full bg-red-100 dark:bg-red-600/20 hover:bg-red-600 text-red-600 dark:text-red-500 hover:text-white border-red-300 dark:border-red-500/50">End</PrimaryButton>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <input type="text" placeholder="nap, walk, vet, alone, play..." className={`rounded-lg p-3 text-sm w-full focus:outline-none border ${bgInput}`} value={newActivityLabel} onChange={(e) => setNewActivityLabel(e.target.value)} />
                                            <div className="flex flex-wrap gap-1.5">
                                                {KNOWN_CONTEXTS.map((c) => (
                                                    <button key={c} onClick={() => setNewActivityLabel(c)} className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${isLightMode ? 'border-slate-300 text-slate-600 hover:text-slate-900 hover:border-violet-500' : 'border-white/15 text-white/60 hover:text-white hover:border-violet-500'}`}>{c}</button>
                                                ))}
                                            </div>
                                            <PrimaryButton onClick={startActivity} className="w-full" disabled={!newActivityLabel}>Start Context</PrimaryButton>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {!isEditing && (
                    <div className="mb-8">
                        <FamilyVideoWidget
                            onAnalysisComplete={setVisionAnalysis}
                        />
                    </div>
                )}

                {!isEditing && recentActivities.length > 0 && cardPrefs.recent && (
                    <div className="mb-8"><Card accent="violet">
                        <h3 className={`text-xl font-bold mb-4 ${tColor}`}>Recent Activities</h3>
                        <div className="space-y-2">
                            {recentActivities.map((a) => {
                                const key = a.activity_label?.trim().toLowerCase();
                                const prior = key ? ACTIVITY_PRIORS[key] : null;
                                const emo = prior ? quadrantEmotion(prior[0], prior[1]) : null;
                                const recording = a.status === "recording";
                                return (
                                    <div key={a.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${bgCardInt} ${borderBase}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: emo ? EMOTION_COLORS[emo] : "#71717a" }} />
                                            <span className={`font-bold capitalize ${tColor}`}>{a.activity_label}</span>
                                            {recording
                                                ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">● recording</span>
                                                : <span className={`text-[10px] uppercase tracking-widest ${tMutedAlt}`}>done</span>}
                                            {prior
                                                ? <span className={`text-xs hidden sm:inline ${tMutedAlt}`}>prior V{prior[0].toFixed(2)} A{prior[1].toFixed(2)}</span>
                                                : <span className={`text-xs hidden sm:inline ${tMutedAlt}`}>logged only</span>}
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <button onClick={() => openActivityTrail(a)}
                                                className={`text-[11px] px-2 py-1 rounded-lg border ${borderBase} ${bgCardInt} ${tMuted} hover:opacity-80 transition`}>
                                                View in 2D
                                            </button>
                                            <div className={`text-xs ${tMutedAlt}`}>{fmtDuration(a.start_time || a.created_at, a.end_time)} · {timeAgo(a.start_time || a.created_at)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`text-[10px] mt-3 uppercase tracking-wider ${tMutedAlt}`}>recognised keywords carry a valence/arousal learning prior · others are just time markers</div>
                    </Card></div>
                )}
            </div>

            {/* Floating Toggle Button for AI Side Drawer */}
            <button
                onClick={() => setShowAiDrawer(!showAiDrawer)}
                className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xl flex items-center gap-2 border border-emerald-400 transition-all transform hover:scale-105"
            >
                <span>🐾</span>
                <span>AI Companion</span>
            </button>

            {/* Slide-out AI Side Drawer */}
            {showAiDrawer && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setShowAiDrawer(false)}>
                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10" onClick={(e) => e.stopPropagation()}>
                        <div className={`w-screen max-w-md border-l ${borderBase} ${isLightMode ? "bg-white" : "bg-zinc-950"} p-6 shadow-2xl flex flex-col justify-between`}>
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🐾</span>
                                        <h3 className={`text-xl font-bold ${tColor}`}>AI Companion</h3>
                                        {aiLoading && <span className="text-xs text-emerald-500 uppercase tracking-widest font-bold animate-pulse">thinking…</span>}
                                    </div>
                                    <button onClick={() => setShowAiDrawer(false)} className={`text-sm font-bold ${tMuted} hover:text-white`}>✕ Close</button>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    {aiUpdatedAt && !aiLoading && <span className={`text-xs uppercase tracking-widest font-bold ${tMutedAlt}`}>{timeAgo(new Date(aiUpdatedAt).toISOString())}</span>}
                                    <SecondaryButton onClick={() => askAI()} disabled={aiLoading}>Force Refresh</SecondaryButton>
                                </div>

                                <div
                                    ref={chatScrollRef}
                                    className="flex flex-col gap-3 max-h-[calc(100vh-250px)] overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
                                >
                                    {aiMessages.length === 0 && !aiLoading && !aiError && (
                                        <div className={`text-sm italic ${tMutedAlt}`}>Waiting for initial telemetry analysis...</div>
                                    )}

                                    {aiMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                                    ? isLightMode
                                                        ? "bg-emerald-100 border-emerald-200 text-emerald-900 ml-auto max-w-[85%]"
                                                        : "bg-emerald-600/20 border-emerald-500/30 text-emerald-50 ml-auto max-w-[85%]"
                                                    : isLightMode
                                                        ? "bg-slate-100 border-slate-200 text-slate-800 mr-auto max-w-[95%]"
                                                        : "bg-white/5 border-white/10 text-white/85 mr-auto max-w-[95%]"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    ))}

                                    {aiError && (
                                        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg p-3">
                                            Couldn&apos;t reach the AI service. {aiError}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-white/10">
                                <input
                                    type="text"
                                    placeholder="Ask about telemetry..."
                                    className={`flex-1 rounded-lg p-3 text-sm focus:outline-none transition-colors border ${bgInput}`}
                                    value={aiChatInput}
                                    onChange={(e) => setAiChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                                    disabled={aiLoading}
                                />
                                <PrimaryButton
                                    onClick={handleSendChat}
                                    disabled={!aiChatInput.trim() || aiLoading}
                                    className="bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 disabled:opacity-50"
                                >
                                    Send
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {trailActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeActivityTrail}>
                    <div className={`w-full max-w-3xl rounded-2xl border p-5 ${borderBase} ${isLightMode ? "bg-white" : "bg-zinc-950"}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <h3 className={`text-xl font-bold capitalize ${tColor}`}>{trailActivity.activity_label} — in 2D space</h3>
                            <SecondaryButton onClick={closeActivityTrail}>Close</SecondaryButton>
                        </div>
                        <div className={`text-xs mb-4 ${tMuted}`}>
                            {fmtDuration(trailActivity.start_time || trailActivity.created_at, trailActivity.end_time)} ·
                            {trailLoading ? " loading…" : ` ${trailPoints.length} affect points`}
                            {trailPoints.length > 0 && (() => {
                                const counts: Record<string, number> = {};
                                trailPoints.forEach(p => { const e = p.predicted_emotion || "UNCERTAIN"; counts[e] = (counts[e] || 0) + 1; });
                                const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                                return top ? ` · mostly ${top[0]} (${Math.round((top[1] / trailPoints.length) * 100)}%)` : "";
                            })()}
                        </div>
                        {trailLoading ? (
                            <div className={`h-80 flex items-center justify-center ${tMuted}`}>Loading trajectory…</div>
                        ) : trailPoints.length === 0 ? (
                            <div className={`h-80 flex items-center justify-center text-center text-sm ${tMuted}`}>No affect data was recorded during this activity window.</div>
                        ) : (
                            <div className={`w-full rounded-xl overflow-hidden border p-2 ${bgCardInt} ${borderBase}`}>
                                <Plot data={[
                                    { x: ANCHORS.map(a => a.v), y: ANCHORS.map(a => a.a), text: ANCHORS.map(a => a.name), type: "scatter", mode: "markers+text", textposition: "top center", textfont: { color: isLightMode ? "#64748b" : "#777", size: 11 }, hoverinfo: "text", marker: { size: 14, symbol: "cross", color: ANCHORS.map(a => EMOTION_COLORS[a.name]) } },
                                    { x: trailPoints.map(p => p.valence), y: trailPoints.map(p => p.arousal), type: "scatter", mode: "lines+markers", line: { color: isLightMode ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.18)", width: 1 }, marker: { size: 6, opacity: 0.7, color: trailPoints.map(p => EMOTION_COLORS[p.predicted_emotion] || "#888") }, hoverinfo: "x+y" },
                                    { x: [trailPoints[0].valence], y: [trailPoints[0].arousal], type: "scatter", mode: "markers+text", text: ["start"], textposition: "bottom center", textfont: { color: "#22c55e", size: 11 }, marker: { size: 14, color: "#22c55e", symbol: "circle", line: { color: isLightMode ? "#fff" : "#000", width: 1 } }, hoverinfo: "text" },
                                    { x: [trailPoints[trailPoints.length - 1].valence], y: [trailPoints[trailPoints.length - 1].arousal], type: "scatter", mode: "markers+text", text: ["end"], textposition: "top center", textfont: { color: "#ef4444", size: 11 }, marker: { size: 14, color: "#ef4444", symbol: "square", line: { color: isLightMode ? "#fff" : "#000", width: 1 } }, hoverinfo: "text" },
                                    ...(ACTIVITY_PRIORS[trailActivity.activity_label?.trim().toLowerCase()] ? [{ x: [ACTIVITY_PRIORS[trailActivity.activity_label.trim().toLowerCase()][0]], y: [ACTIVITY_PRIORS[trailActivity.activity_label.trim().toLowerCase()][1]], type: "scatter", mode: "markers+text", text: ["expected"], textposition: "bottom center", textfont: { color: "#a78bfa", size: 11 }, marker: { size: 16, symbol: "star", color: "#a78bfa", line: { color: isLightMode ? "#000" : "#fff", width: 1 } }, hoverinfo: "text" }] : []),
                                ] as any}
                                    layout={{
                                        autosize: true, height: 420, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: isLightMode ? "#0f172a" : "#fff" }, showlegend: false,
                                        xaxis: { title: "Valence", range: [-1.1, 1.1], zeroline: true, zerolinecolor: isLightMode ? "#cbd5e1" : "#555", gridcolor: isLightMode ? "#e2e8f0" : "#222" },
                                        yaxis: { title: "Arousal", range: [-1.1, 1.1], zeroline: true, zerolinecolor: isLightMode ? "#cbd5e1" : "#555", gridcolor: isLightMode ? "#e2e8f0" : "#222", scaleanchor: "x" },
                                        margin: { l: 50, r: 20, b: 50, t: 10 }
                                    } as any}
                                    useResizeHandler style={{ width: "100%", height: "100%" }} />
                            </div>
                        )}
                        <div className={`text-[10px] mt-3 uppercase tracking-wider ${tMutedAlt}`}>green = start · red = end · star = the activity&apos;s expected feeling · path = how {dog?.name || "they"} moved through valence–arousal during it</div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}