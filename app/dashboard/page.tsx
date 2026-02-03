"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { PageShell, Card, Metric, IconHeart, IconMove, IconWave, IconBark, IconSmile, ConfidenceBar, Pill, SecondaryButton, Field, PrimaryButton } from "../_components/ds";

export default function DashboardPage() {
  const [dog, setDog] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", breed: "", weight: "", age: "" });
  const router = useRouter();

  const getData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/login");
    const { data } = await supabase.from('dogs').select('*').eq('user_id', session.user.id).single();
    if (data) {
      setDog(data);
      setEditForm({ name: data.name, breed: data.breed, weight: data.weight, age: data.age });
    }
  };

  useEffect(() => { getData(); }, []);

  const handleUpdate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('dogs').update({
      name: editForm.name,
      breed: editForm.breed,
      weight: parseFloat(editForm.weight),
      age: parseInt(editForm.age)
    }).eq('user_id', session?.user.id);

    if (!error) {
      setIsEditing(false);
      getData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <PageShell 
      subtitle="Live Telemetry"
      rightSlot={<SecondaryButton onClick={handleLogout}>Logout</SecondaryButton>}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-12">
          <div>
            <h2 className="text-6xl font-black text-white tracking-tighter">
              {dog?.name || "Dog"}'s Status
            </h2>
            <p className="text-white/40 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">
              {dog?.breed} • {dog?.age} Years Old • {dog?.weight}kg
            </p>
          </div>
          <div className="flex gap-3">
            <SecondaryButton onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </SecondaryButton>
            <Pill tone="emerald" label="AI Inference Live" />
          </div>
        </div>

        {isEditing ? (
          <div className="mb-12">
            <Card accent="violet">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <Field label="Name" value={editForm.name} onChange={(v:any) => setEditForm({...editForm, name: v})} />
                <Field label="Breed" value={editForm.breed} onChange={(v:any) => setEditForm({...editForm, breed: v})} />
                <Field label="Age" type="number" value={editForm.age} onChange={(v:any) => setEditForm({...editForm, age: v})} />
                <Field label="Weight" type="number" value={editForm.weight} onChange={(v:any) => setEditForm({...editForm, weight: v})} />
                <div className="md:col-span-4 pt-4">
                   <PrimaryButton onClick={handleUpdate}>Save Changes</PrimaryButton>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <Card accent="fuchsia" className="lg:col-span-2">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                     <div className="p-6 bg-white/[0.05] rounded-3xl text-fuchsia-400"><IconSmile /></div>
                     <div>
                        <div className="text-4xl font-black text-white uppercase tracking-tight">{dog?.emotion || "Happy"}</div>
                        <div className="text-sm text-white/40 italic">Emotional AI Prediction</div>
                     </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Health Status</div>
                    <div className="text-emerald-400 font-bold uppercase text-xs">Optimal Condition</div>
                  </div>
               </div>
               <ConfidenceBar pct={94} />
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <Metric label="Heart Rate" value="84 BPM" icon={<IconHeart />} />
              <Metric label="Barking" value="None" icon={<IconBark />} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Metric label="Activity" value="Normal" icon={<IconMove />} />
            <Metric label="Temperature" value="38.5°C" icon={<IconWave />} />
            <Metric label="Sync State" value="Cloud" icon={<IconWave />} />
            <Metric label="GPS Status" value="Locked" icon={<IconMove />} />
        </div>
      </div>
    </PageShell>
  );
}