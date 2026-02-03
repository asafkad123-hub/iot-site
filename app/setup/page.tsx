"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, Field, PageShell, PrimaryButton } from "../_components/ds";

export default function SetupPage() {
  const router = useRouter();
  // הוספת age ל-State
  const [form, setForm] = useState({ name: "", breed: "", weight: "", age: "" });

  const handleSave = async () => {
    if (!form.name || !form.breed || !form.age) return alert("Please fill in all required fields.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { error } = await supabase.from('dogs').upsert({
      user_id: session.user.id,
      name: form.name,
      breed: form.breed,
      weight: parseFloat(form.weight) || 0,
      age: parseInt(form.age) || 0 // שליחת הגיל לטבלה
    }, { onConflict: 'user_id' });

    if (!error) {
      router.push("/connect");
    } else {
      alert(error.message);
    }
  };

  return (
    <PageShell subtitle="Hardware Initialization">
      <div className="mx-auto max-w-xl px-6 py-12">
        <Card accent="violet">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Dog Profile</h2>
          <p className="text-white/30 text-xs mb-10 font-bold uppercase tracking-widest">Calibrating biometric sensors</p>
          
          <div className="space-y-6">
            <Field label="Dog Name" placeholder="e.g. Max" value={form.name} onChange={(v:any) => setForm({...form, name: v})} />
            <Field label="Breed" placeholder="e.g. Golden Retriever" value={form.breed} onChange={(v:any) => setForm({...form, breed: v})} />
            
            {/* שורת הגיל והמשקל זה לצד זה */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age (Years)" type="number" placeholder="e.g. 3" value={form.age} onChange={(v:any) => setForm({...form, age: v})} />
              <Field label="Weight (kg)" type="number" placeholder="e.g. 25" value={form.weight} onChange={(v:any) => setForm({...form, weight: v})} />
            </div>

            <div className="pt-6 text-center">
              <PrimaryButton onClick={handleSave}>Initialize & Connect</PrimaryButton>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}