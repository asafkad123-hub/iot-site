import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_60%)]" />
      </div>

      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <IconPaw />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">DogSense</div>
            <div className="text-xs text-zinc-500">Realtime collar insights</div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/setup"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 md:grid-cols-2 md:items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-600 shadow-sm">
            Live monitoring <Dot /> AI insights <Dot /> Elegant UI
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Understand your dog&apos;s emotions
            <span className="text-zinc-500"> through real-time collar sensor monitoring</span>
          </h1>

          <ul className="mt-6 space-y-3 text-zinc-700">
            <Feature icon={<IconHeart />} title="Real time heart rate monitoring" />
            <Feature icon={<IconBark />} title="Bark pattern analysis" />
            <Feature icon={<IconMove />} title="Movement and posture tracking" />
            <Feature icon={<IconBrain />} title="AI powered emotion detection" />
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/setup"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              Get Started
            </Link>

            <div className="text-xs text-zinc-500">
              One-time setup <Dot /> Then you go straight to your dashboard
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniPill label="Realtime" />
            <MiniPill label="Secure" />
            <MiniPill label="Readable" />
            <MiniPill label="Scalable" />
          </div>
        </div>

        {/* Preview card */}
        <div className="rounded-3xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Live preview</div>
              <div className="text-xs text-zinc-500">Clean, calm, and readable</div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard label="Heart Rate" value="92 bpm" icon={<IconHeart />} />
            <MetricCard label="HRV" value="48 ms" icon={<IconWave />} />
            <MetricCard label="Activity" value="High" icon={<IconSpark />} />
            <MetricCard label="Barks" value="Low" icon={<IconSound />} />
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Emotion</div>
              <span className="text-xs text-zinc-500">confidence</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700">
                  <IconSmile />
                </span>
                <div>
                  <div className="text-sm font-semibold">Happy</div>
                  <div className="text-xs text-zinc-500">calm + engaged</div>
                </div>
              </div>

              <div className="text-sm font-semibold">84%</div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-[84%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-zinc-500">
        © {new Date().getFullYear()} DogSense <Dot /> UI prototype (no backend yet)
      </footer>
    </main>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm">
        {icon}
      </span>
      <div className="pt-2 text-sm">{title}</div>
    </li>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-zinc-600">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">updated just now</div>
    </div>
  );
}

function MiniPill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2 text-center text-xs text-zinc-600 shadow-sm">
      {label}
    </div>
  );
}

function Dot() {
  return <span className="mx-2 inline-block h-1 w-1 rounded-full bg-zinc-400 align-middle" />;
}

/* Icons (clean + consistent) */
function IconPaw() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-zinc-800">
      <path
        d="M8.5 12.5c-1.3 0-2.5-1.5-2.5-3.1S7.2 6 8.5 6s2.5 1.5 2.5 3.4-1.2 3.1-2.5 3.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 12.5c-1.3 0-2.5-1.5-2.5-3.1S14.2 6 15.5 6s2.5 1.5 2.5 3.4-1.2 3.1-2.5 3.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6.6 16.3c-.3-1.7 1.4-3.3 3.1-3.3h4.6c1.7 0 3.4 1.6 3.1 3.3-.3 1.8-1.9 3.7-5.4 3.7s-5.1-1.9-5.4-3.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6 9.8c-.9 0-1.7-1-1.7-2.1S5.1 5.5 6 5.5s1.7 1 1.7 2.2S6.9 9.8 6 9.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M18 9.8c-.9 0-1.7-1-1.7-2.1S17.1 5.5 18 5.5s1.7 1 1.7 2.2S18.9 9.8 18 9.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M12 21s-7-4.35-9.5-8.5C.5 9 2.5 6 6 6c2 0 3.2 1.1 4 2.1C10.8 7.1 12 6 14 6c3.5 0 5.5 3 3.5 6.5C19 16.65 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M3 12h4l2-6 4 12 2-6h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSound() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M11 5 7 9H3v6h4l4 4V5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M5 12v-2a3 3 0 0 1 3-3h1l2-2h2l2 2h1a3 3 0 0 1 3 3v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7 12v5a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 13h-1M20 13h1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMove() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M4 14c4-8 8 8 16 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M4 18c4-6 8 6 16 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 7h6M9 17h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconSmile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path
        d="M8.5 14.5c.9 1.2 2.1 2 3.5 2s2.6-.8 3.5-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 10h.01M15 10h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
