"use client";
import { PageShell, Card, Pill, PrimaryButton } from "./_components/ds";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05060b] bg-noise relative overflow-hidden text-white font-sans">
      {/* רקע כוכבים וערפילית */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <PageShell subtitle="Realtime collar insights">
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* צד שמאל - טקסט חזק */}
            <div className="space-y-8">
              <div className="flex gap-3">
                <Pill tone="emerald" label="Live monitoring" />
                <Pill tone="violet" label="AI insights" />
              </div>
              
              <h1 className="text-[72px] lg:text-[88px] font-black leading-[1.05] tracking-tight text-white italic">
                Understand your dog's <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">emotions</span> through real-time collar sensor monitoring
              </h1>

              <ul className="space-y-4 text-white/60 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">✓</div>
                  Real time heart rate monitoring
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">✓</div>
                  Bark pattern analysis
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">✓</div>
                  Movement and posture tracking
                </li>
              </ul>

              <div className="flex items-center gap-6 pt-4">
                <a href="/login" className="px-10 py-4 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg shadow-violet-500/25">
                  Get Started
                </a>
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">
                  One-time setup • Straight to dashboard
                </span>
              </div>
            </div>

            {/* צד ימין - דוגמה של הדשבורד (Glassmorphism) */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 blur-3xl rounded-[40px]" />
              <Card accent="violet" className="relative border-white/10 bg-white/5 backdrop-blur-2xl">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-bold italic">Live preview</h3>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      ONLINE
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-white/40 font-bold mb-1">HEART RATE</div>
                      <div className="text-2xl font-black">98 bpm</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-white/40 font-bold mb-1">ACTIVITY</div>
                      <div className="text-2xl font-black text-cyan-400">High</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 col-span-2">
                      <div className="flex justify-between items-end">
                         <div>
                            <div className="text-[10px] text-violet-400 font-bold mb-1">CURRENT EMOTION</div>
                            <div className="text-3xl font-black">Happy</div>
                         </div>
                         <div className="text-right text-[10px] font-bold text-white/40">84% CONFIDENCE</div>
                      </div>
                      <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 w-[84%]" />
                      </div>
                   </div>
                </div>
              </Card>
            </div>

          </div>
        </section>
      </PageShell>
    </div>
  );
}