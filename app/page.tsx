"use client";
import { PageShell, Card, Pill } from "./_components/ds";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05060b] relative overflow-hidden text-white font-sans selection:bg-violet-500/30">
      
      {/* Background Glows - מותאם למובייל */}
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[120%] md:w-[60%] h-[50%] bg-violet-900/20 blur-[80px] md:blur-[150px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[120%] md:w-[60%] h-[50%] bg-blue-900/20 blur-[80px] md:blur-[150px] rounded-full" />
      </div>

      <PageShell subtitle="Realtime collar insights">
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content - Hero Text */}
            <div className="space-y-6 md:space-y-10 text-center lg:text-left order-2 lg:order-1">
              <div className="flex justify-center lg:justify-start gap-2 md:gap-3">
                <Pill tone="emerald" label="Live monitoring" />
                <Pill tone="violet" label="AI insights" />
                <Pill tone="cyan" label="Elegant UI" />
              </div>
              
              <h1 className="text-[42px] leading-[1.1] sm:text-6xl md:text-[84px] font-[1000] tracking-tighter text-white italic">
                Understand your dog's <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                  emotions
                </span> <br className="hidden md:block" />
                through real-time sensors
              </h1>

              <div className="space-y-4 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-3 text-white/50 text-sm md:text-base font-medium justify-center lg:justify-start">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold italic">✓</div>
                  Real time heart rate monitoring
                </div>
                <div className="flex items-center gap-3 text-white/50 text-sm md:text-base font-medium justify-center lg:justify-start">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold italic">✓</div>
                  Bark pattern analysis & AI detection
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 justify-center lg:justify-start">
                <a href="/login" className="w-full sm:w-auto text-center px-12 py-5 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-[20px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-violet-500/20">
                  Get Started
                </a>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">System Status</span>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">v2.0 Deploy Ready</span>
                </div>
              </div>
            </div>

            {/* Right Content - Futuristic Card */}
            <div className="relative order-1 lg:order-2">
              <div className="absolute -inset-10 bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 blur-[100px] rounded-full opacity-50" />
              
              <Card accent="violet" className="relative border-white/10 bg-white/5 backdrop-blur-[30px] p-6 md:p-10">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-xl font-black italic tracking-tight">Live Preview</h3>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Telemetry Handshake Active</p>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      LIVE FEED
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                   <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors">
                      <div className="text-[9px] text-white/30 font-black mb-2 uppercase tracking-widest">Heart Rate</div>
                      <div className="text-3xl font-black">98 <span className="text-sm text-white/20 font-medium">bpm</span></div>
                   </div>
                   <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors">
                      <div className="text-[9px] text-white/30 font-black mb-2 uppercase tracking-widest">Activity</div>
                      <div className="text-3xl font-black text-cyan-400">High</div>
                   </div>
                   
                   <div className="p-6 rounded-[28px] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 col-span-2 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <div className="text-[9px] text-violet-400 font-black uppercase tracking-widest mb-1">Current Emotion</div>
                            <div className="text-3xl font-[1000] italic">Happy</div>
                          </div>
                          <div className="text-right">
                             <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">AI Confidence</div>
                             <div className="text-lg font-black text-white/80 tracking-tighter">84%</div>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                           <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 rounded-full w-[84%] transition-all duration-1000" />
                        </div>
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