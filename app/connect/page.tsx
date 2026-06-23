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

    try {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      const userId = data?.session?.user?.id;

      if (sessionError || !userId) {
        throw new Error("No active session");
      }

      const { error } = await supabase
        .from("dogs")
        .update({
          is_connected: true,
          collar_id: collarId.trim(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Failed to connect collar");
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <Card accent="cyan">
        <div className="mx-auto h-24 w-24 rounded-full border-[6px] border-cyan-500/20 border-t-cyan-500 animate-spin mb-10" />

        <h2 className="text-3xl font-black text-white mb-4">
          Pairing Protocol
        </h2>

        <p className="text-white/30 text-xs uppercase mb-8">
          Link Hardware Identifier
        </p>

        <Field
          label="Hardware Collar ID"
          placeholder="e.g. collar_001"
          value={collarId}
          onChange={setCollarId}
        />

        <PrimaryButton onClick={handleConnect} disabled={loading}>
          {loading ? "Establishing Sync..." : "Initialize Link"}
        </PrimaryButton>
      </Card>
    </PageShell>
  );
}