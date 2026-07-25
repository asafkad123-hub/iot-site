"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell, Card, PrimaryButton, Pill } from "../_components/ds";

export default function ConnectPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    // Simulating hardware handshake delay
    setTimeout(() => {
      router.push("/choose-mode");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05060b] relative overflow-hidden text-white font-sans selection:bg-violet-500/30">
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[120%] md:w-[60%] h-[50%] bg-violet-900/20 blur-[80px] md:blur-[150px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[120%] md:w-[60%] h-[50%] bg-blue-900/20 blur-[80px] md:blur-[150px] rounded-full" />
      </div>

      <PageShell subtitle="Hardware Pairing">
        <div className="mx-auto max-w-xl px-6 py-12 relative z-10">
          <Card accent="violet">
            <div className="text-center mb-8">
              <Pill tone="violet" label="Step 2 of 3" />
              <h2 className="text-3xl font-black text-white mt-4 mb-2 tracking-tighter italic">
                Connect Smart Collar
              </h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                Bring the collar near your device to complete setup
              </p>
            </div>

            <div className="space-y-8 text-center">
              <div className="py-8 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-violet-500/10 border-2 border-violet-500/40 flex items-center justify-center animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-400 flex items-center justify-center text-violet-300 font-black text-xl">
                    BLE
                  </div>
                </div>
              </div>

              <PrimaryButton onClick={handleConnect} className="w-full">
                {connecting ? "Establishing Handshake..." : "Connect Collar"}
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </PageShell>
    </div>
  );
}