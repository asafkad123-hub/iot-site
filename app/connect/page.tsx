"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, PageShell, PrimaryButton } from "../_components/ds";

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('dogs').update({ is_connected: true }).eq('user_id', session?.user.id);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <PageShell subtitle="Hardware Protocol">
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <Card accent="cyan">
          <div className="mx-auto h-24 w-24 rounded-full border-[6px] border-cyan-500/20 border-t-cyan-500 animate-[spin_3s_linear_infinite] mb-10" />
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Pairing Protocol</h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-12">Waiting for handshake from ESP32</p>
          <PrimaryButton onClick={handleConnect} disabled={loading}>
            {loading ? "Establishing Sync..." : "Initialize Link"}
          </PrimaryButton>
        </Card>
      </div>
    </PageShell>
  );
}