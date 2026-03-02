"use client";
import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const [dog, setDog] = useState<any>(null);
  // משתנה חדש עבור הנתונים מה-ESP32
  const [liveMetrics, setLiveMetrics] = useState<any>(null); 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    breed: "",
    weight: "",
    age: "",
  });
  const router = useRouter();

  const getData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/login");

    // 1. שליפת פרופיל הכלב
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

    // 2. שליפת הנתון האחרון מה-ESP32 (טבלת המדדים)
    const { data: metricsData } = await supabase
      .from("dog_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (metricsData) {
      setLiveMetrics(metricsData);
    }
  };

  useEffect(() => {
    getData();

    // 3. הגדרת האזנה לשינויים בזמן אמת (Realtime)
    const channel = supabase
      .channel("realtime-dog-metrics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dog_metrics" },
        (payload) => {
          console.log("נתון חדש מה-ESP32!", payload.new);
          setLiveMetrics(payload.new); // עדכון הדף בנתון החדש
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

  // --- שימוש בנתונים האמיתיים מה-ESP32 ---
  // אם אין עדיין נתונים, נשתמש בערכי ברירת מחדל
  const emotion = liveMetrics?.emotion ?? "Waiting...";
  const confidencePct = 85; // אפשר להוסיף עמודה כזו ב-ESP32 אם תרצה
  const heartRateBpm = liveMetrics?.heart_rate ?? "--";
  const hrvMs = liveMetrics?.hrv ?? "--";
  const activityState = liveMetrics?.posture ?? "Unknown";
  const barkingLabel = liveMetrics?.emotion === "Barking" ? "Yes" : "No";

  return (
    <PageShell
      subtitle="Live Telemetry"
      rightSlot={<SecondaryButton onClick={handleLogout}>Logout</SecondaryButton>}
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
            <Pill tone={liveMetrics ? "emerald" : "amber"} label={liveMetrics ? "AI Inference Live" : "Connecting..."} />
          </div>
        </div>

        {/* Dog Profile Card */}
        <div className="mb-6 sm:mb-8">
          <Card accent="violet">
             {/* ... (כל החלק של ה-Profile נשאר אותו דבר כמו ששלחת) ... */}
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
               <div>
                 <div className="text-xl sm:text-2xl font-black tracking-tight">Dog Profile</div>
                 <div className="text-white/40 text-sm italic">{isEditing ? "Edit details" : "Saved details"}</div>
               </div>
             </div>
             {isEditing ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <Field label="Name" value={editForm.name} onChange={(v: any) => setEditForm({ ...editForm, name: v })} />
                  <Field label="Breed" value={editForm.breed} onChange={(v: any) => setEditForm({ ...editForm, breed: v })} />
                  <Field label="Age" type="number" value={editForm.age} onChange={(v: any) => setEditForm({ ...editForm, age: v })} />
                  <Field label="Weight" type="number" value={editForm.weight} onChange={(v: any) => setEditForm({ ...editForm, weight: v })} />
                  <div className="lg:col-span-4 pt-2">
                    <PrimaryButton onClick={handleUpdate}>Save Changes</PrimaryButton>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Name</div>
                    <div className="mt-1 text-base font-black text-white/85">{dog?.name || "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Breed</div>
                    <div className="mt-1 text-base font-black text-white/85">{dog?.breed || "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Age</div>
                    <div className="mt-1 text-base font-black text-white/85">{dog?.age || "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Weight</div>
                    <div className="mt-1 text-base font-black text-white/85">{dog?.weight || "—"}kg</div>
                  </div>
               </div>
             )}
          </Card>
        </div>

        {/* Real Metrics Section */}
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
                      {emotion}
                    </div>
                    <div className="text-sm text-white/40 italic">
                      Live AI Prediction from ESP32
                    </div>
                  </div>
                </div>
                <div className="sm:text-right">
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Status</div>
                   <div className="text-xl font-black text-white/90">{liveMetrics ? "CONNECTED" : "OFFLINE"}</div>
                </div>
              </div>
              <div className="mt-5">
                <ConfidenceBar pct={confidencePct} />
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Metric label="Heart Rate" value={`${heartRateBpm} BPM`} icon={<IconHeart />} />
              <Metric label="HRV" value={`${hrvMs} ms`} icon={<IconHeart />} />
              <Metric label="Posture" value={activityState} icon={<IconMove />} />
              <Metric label="Barking" value={barkingLabel} icon={<IconBark />} />
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}