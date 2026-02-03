import {
  Card,
  Dot,
  IconBark,
  IconHeart,
  IconMove,
  IconSmile,
  IconWave,
  Metric,
  PageShell,
  Pill,
  PrimaryButton,
} from "./_components/ds";

export default function Home() {
  return (
    <PageShell
      rightSlot={<PrimaryButton href="/setup">Get Started</PrimaryButton>}
      title="DogSense"
      subtitle="Realtime collar insights"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* LEFT */}
          <div>
            <div className="mb-4 inline-flex flex-wrap items-center gap-2">
              <Pill tone="emerald" label="Live monitoring" />
              <Pill tone="violet" label="AI insights" />
              <Pill tone="cyan" label="Elegant UI" />
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Understand your dog&apos;s{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                emotions
              </span>{" "}
              through real-time collar sensor monitoring
            </h1>

            <ul className="mt-6 grid gap-3 text-sm text-white/75">
              <FeatureRow icon={<IconHeart />} text="Real time heart rate monitoring" />
              <FeatureRow icon={<IconBark />} text="Bark pattern analysis" />
              <FeatureRow icon={<IconMove />} text="Movement and posture tracking" />
              <FeatureRow icon={<IconWave />} text="AI powered emotion detection" />
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/setup">Get Started</PrimaryButton>
              <div className="text-xs text-white/55">
                One-time setup <Dot /> Then you go straight to your dashboard
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="violet" label="Realtime" />
              <Pill tone="cyan" label="Secure" />
              <Pill tone="emerald" label="Readable" />
              <Pill tone="amber" label="Scalable" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            {/* extra visual glow behind the preview */}
            <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-cyan-400/15 blur-2xl" />

            <Card accent="cyan">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/90">
                    Live preview
                  </div>
                  <div className="text-xs text-white/55">
                    Clean, calm, and readable
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                  Online
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Metric accent="fuchsia" label="Heart Rate" value="92 bpm" hint="updated just now" icon={<IconHeart />} />
                <Metric accent="cyan" label="HRV" value="48 ms" hint="updated just now" icon={<IconWave />} />
                <Metric accent="emerald" label="Activity" value="High" hint="updated just now" icon={<IconMove />} />
                <Metric accent="amber" label="Barks" value="Low" hint="updated just now" icon={<IconBark />} />
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/90">
                    Emotion
                  </div>
                  <div className="text-xs text-white/55">confidence</div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/85">
                      <IconSmile />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white/90">
                        Happy
                      </div>
                      <div className="text-xs text-white/55">
                        calm + engaged
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white/90">
                    84%
                  </div>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400" />
                </div>

                {/* tiny sparkline for extra visuals */}
                <div className="mt-4 h-16 overflow-hidden rounded-2xl border border-white/10 bg-[#070814] p-3">
                  <svg viewBox="0 0 600 120" className="h-full w-full" fill="none">
                    <path
                      d="M0 75 C 70 25, 140 100, 210 60 C 280 20, 350 90, 420 50 C 490 12, 540 95, 600 40"
                      stroke="rgba(168,85,247,0.9)"
                      strokeWidth="3"
                    />
                    <path
                      d="M0 90 C 80 70, 160 105, 240 80 C 320 55, 390 110, 470 72 C 550 35, 580 92, 600 64"
                      stroke="rgba(34,211,238,0.85)"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
        {icon}
      </span>
      {text}
    </li>
  );
}
