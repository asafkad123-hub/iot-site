"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageShell, Card } from "../_components/ds";

export default function ChooseModePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#05060b] relative overflow-hidden text-white font-sans selection:bg-violet-500/30">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] md:w-[60%] h-[60%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[120%] md:w-[60%] h-[60%] bg-cyan-900/20 blur-[120px] rounded-full" />
      </div>

      <PageShell subtitle="System Architecture • Select Interface">
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-20 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-violet-400 uppercase mb-6 backdrop-blur-md">
            <span>●</span> Interface Protocol
          </div>

          <h1 className="text-4xl md:text-5xl font-[1000] italic tracking-tight text-white mb-4">
            Select Operating Mode
          </h1>
          <p className="text-sm text-white/50 max-w-md mx-auto mb-14 leading-relaxed font-medium">
            Choose your tailored view to monitor real-time biometrics, behavior modeling, and device status.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            
            {/* Family View Option */}
            <div
              onClick={() => router.push("/family")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              <Card accent="violet" className="h-full p-8 border-white/10 bg-white/5 backdrop-blur-xl group-hover:border-violet-500/50 group-hover:bg-violet-500/10 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-black text-xl group-hover:scale-110 transition-transform">
                    🐾
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400/80 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                    Simplified
                  </span>
                </div>

                <h2 className="text-2xl font-black italic text-white mb-2 group-hover:text-violet-300 transition-colors">
                  Family Mode
                </h2>
                <p className="text-xs text-white/50 leading-relaxed font-normal mb-8">
                  Streamlined, high-level overview featuring core emotional state indicators, live vitals, battery health, and AI interaction.
                </p>

                <div className="flex items-center gap-2 text-xs font-black tracking-wider text-violet-400 uppercase group-hover:translate-x-1 transition-transform">
                  Launch Interface <span>→</span>
                </div>
              </Card>
            </div>

            {/* Professional View Option */}
            <div
              onClick={() => router.push("/dashboard")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              <Card accent="cyan" className="h-full p-8 border-white/10 bg-white/5 backdrop-blur-xl group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                    Advanced
                  </span>
                </div>

                <h2 className="text-2xl font-black italic text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  Professional Mode
                </h2>
                <p className="text-xs text-white/50 leading-relaxed font-normal mb-8">
                  Full telemetry suite including raw accelerometer/gyroscope channels, multi-sensor fusion, circumplex emotion graphs, and deep logging.
                </p>

                <div className="flex items-center gap-2 text-xs font-black tracking-wider text-cyan-400 uppercase group-hover:translate-x-1 transition-transform">
                  Launch Suite <span>→</span>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </PageShell>
    </div>
  );
}
