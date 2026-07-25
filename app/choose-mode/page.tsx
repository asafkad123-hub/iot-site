"use client";

import { useRouter } from "next/navigation";
import { Card, PageShell, Pill } from "../_components/ds";

export default function ChooseModePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#05060b] relative overflow-hidden text-white font-sans selection:bg-violet-500/30">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[120%] md:w-[60%] h-[50%] bg-violet-900/20 blur-[80px] md:blur-[150px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[120%] md:w-[60%] h-[50%] bg-blue-900/20 blur-[80px] md:blur-[150px] rounded-full" />
      </div>

      <PageShell subtitle="System Configuration">
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center gap-2 mb-4">
              <Pill tone="violet" label="Step 3 of 3" />
              <Pill tone="cyan" label="Dashboard Selection" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-3">
              Choose Dashboard Mode
            </h1>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Select the experience that best fits your daily needs. You can switch between modes at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Professional Mode Card */}
            <div
              onClick={() => router.push("/dashboard")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Card
                accent="violet"
                className="h-full border-white/10 bg-white/5 backdrop-blur-[30px] p-8 flex flex-col justify-between hover:border-violet-500/50 hover:bg-violet-500/[0.03] transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-violet-400">
                      Advanced Analytics
                    </span>
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                      ➔
                    </div>
                  </div>
                  <h2 className="text-2xl font-black italic mb-3 text-white">
                    Professional Mode
                  </h2>
                  <p className="text-xs text-white/50 leading-relaxed mb-6">
                    Full access to biometrics, live telemetry plots, trend analysis, heart rate variability, and high-frequency sensor readings.
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-emerald-400 font-bold">✓</span> Real-time Plotly charts
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-emerald-400 font-bold">✓</span> High-frequency sensor stream
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-emerald-400 font-bold">✓</span> Raw telemetry data export
                  </div>
                </div>
              </Card>
            </div>

            {/* Family Mode Card */}
            <div
              onClick={() => router.push("/dashboard/family")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Card
                accent="cyan"
                className="h-full border-white/10 bg-white/5 backdrop-blur-[30px] p-8 flex flex-col justify-between hover:border-cyan-500/50 hover:bg-cyan-500/[0.03] transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                      Simplified & Clean
                    </span>
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                      ➔
                    </div>
                  </div>
                  <h2 className="text-2xl font-black italic mb-3 text-white">
                    Family Mode
                  </h2>
                  <p className="text-xs text-white/50 leading-relaxed mb-6">
                    A streamlined, clutter-free view focused on immediate emotional state, clear vitals, and instant AI Assistant advice.
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-emerald-400 font-bold">✓</span> Real-time emotion & status
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-emerald-400 font-bold">✓</span> Full AI Assistant integration
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-emerald-400 font-bold">✓</span> Simple, graph-free cards
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}