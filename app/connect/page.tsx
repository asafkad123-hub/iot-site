"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, PageShell, PrimaryButton, Field } from "../_components/ds";

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);
  const [collarId, setCollarId] = useState("");
  const router = useRouter();

  const handleConnect = async () => {
    if (!collarId.trim()) {
      alert("Please enter a hardware Collar ID.");
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    // Assign the physical hardware ID to this user's dog profile
    const { error } = await supabase
      .from('dogs')
      .update({ collar_id: collarId.trim() })
      .eq('user_id', session?.user.id);

    if (error) {
      alert(`Error assigning collar: ${error.message}`);
      setLoading(false);
      return;
    }

    setTimeout(() => router.push("/dashboard"), 1000);
  };

  return (
    <PageShell subtitle="Hardware Protocol">
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <Card accent="cyan">
          <div className="mx-auto h-24 w-24 rounded-full border-[6px] border-cyan-500/20 border-t-cyan-500 animate-[spin_3s_linear_infinite] mb-10" />
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Pairing Protocol</h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Link Hardware Identifier</p>
          
          <div className="text-left mb-8">
            <Field 
              label="Hardware Collar ID" 
              placeholder="e.g. collar_001" 
              value={collarId} 
              onChange={setCollarId} 
            />
          </div>

          <PrimaryButton onClick={handleConnect} disabled={loading}>
            {loading ? "Establishing Sync..." : "Initialize Link"}
          </PrimaryButton>
        </Card>
      </div>
    </PageShell>
  );
}