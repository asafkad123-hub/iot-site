"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, Field, PageShell, PrimaryButton, SecondaryButton } from "../_components/ds";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (isSignUp: boolean) => {
    setLoading(true);
    const { error, data } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else if (data?.user) {
      // בדיקה אם יש כבר כלב
      const { data: dog } = await supabase.from('dogs').select('id').eq('user_id', data.user.id).single();
      if (dog) router.push("/dashboard");
      else router.push("/setup");
    }
    setLoading(false);
  };

  return (
    <PageShell subtitle="Security Gateway">
      <div className="mx-auto max-w-md px-6 py-20">
        <Card accent="violet">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Access Cloud</h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-10">Syncing with DogSense IoT</p>
          <div className="space-y-5">
            <Field label="Email" placeholder="admin@dogsense.io" value={email} onChange={setEmail} />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <div className="pt-8 flex flex-col gap-4">
              <PrimaryButton onClick={() => handleAuth(false)} disabled={loading}>Authorize</PrimaryButton>
              <SecondaryButton onClick={() => handleAuth(true)}>Register</SecondaryButton>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}