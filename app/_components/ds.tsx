import Link from "next/link";
import React from "react";

export function PageShell({
  children,
  title = "DogSense",
  subtitle = "Realtime collar insights",
  rightSlot,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <Bg />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[1px] shadow-[0_0_30px_rgba(168,85,247,0.35)]">
            <div className="grid h-full w-full place-items-center rounded-2xl bg-[#070814]">
              <IconPaw />
            </div>
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-white/90">
              {title}
            </div>
            <div className="text-xs text-white/55">{subtitle}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">{rightSlot}</div>
      </header>

      {children}

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-white/45">
        © {new Date().getFullYear()} DogSense <Dot /> UI prototype (no backend yet)
      </footer>
    </main>
  );
}

export function Bg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Big colorful blobs */}
      <div className="absolute -top-24 left-[-140px] h-[520px] w-[520px] rounded-full bg-violet-500/25 blur-[90px]" />
      <div className="absolute top-[-140px] right-[-180px] h-[560px] w-[560px] rounded-full bg-cyan-400/20 blur-[95px]" />
      <div className="absolute bottom-[-220px] left-[15%] h-[640px] w-[640px] rounded-full bg-fuchsia-500/18 blur-[110px]" />
      <div className="absolute bottom-[-220px] right-[8%] h-[520px] w-[520px] rounded-full bg-emerald-400/14 blur-[110px]" />

      {/* Subtle sheen */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_25%,transparent_75%,rgba(255,255,255,0.06))]" />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.65))]" />
    </div>
  );
}

export function Dot() {
  return (
    <span className="mx-2 inline-block h-1 w-1 rounded-full bg-white/35 align-middle" />
  );
}

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "violet" | "cyan" | "emerald" | "fuchsia" | "amber";
}) {
  const toneCls =
    tone === "violet"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-100"
      : tone === "cyan"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      : tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "fuchsia"
      ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100"
      : tone === "amber"
      ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
      : "border-white/12 bg-white/5 text-white/70";

  return (
    <div
      className={[
        "rounded-2xl border px-3 py-2 text-center text-xs shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur",
        toneCls,
      ].join(" ")}
    >
      {label}
    </div>
  );
}

export function PrimaryButton({
  children,
  href,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls = [
    "relative inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition",
    disabled
      ? "pointer-events-none bg-white/10 text-white/35"
      : "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-black shadow-[0_18px_45px_rgba(168,85,247,0.25)] hover:brightness-110",
  ].join(" ");

  const inner = (
    <>
      <span className="absolute inset-0 rounded-2xl opacity-0 shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link className={`group ${cls}`} href={href}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`group ${cls}`}
      disabled={disabled}
    >
      {inner}
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  accent = "violet",
}: {
  children: React.ReactNode;
  accent?: "violet" | "cyan" | "emerald" | "fuchsia" | "amber";
}) {
  const glow =
    accent === "cyan"
      ? "from-cyan-400/25 to-blue-500/10"
      : accent === "emerald"
      ? "from-emerald-400/25 to-lime-500/10"
      : accent === "fuchsia"
      ? "from-fuchsia-400/25 to-violet-500/10"
      : accent === "amber"
      ? "from-amber-300/25 to-rose-400/10"
      : "from-violet-500/25 to-fuchsia-500/10";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className={`absolute -inset-10 opacity-70 blur-2xl bg-gradient-to-br ${glow}`} />
      <div className="relative">{children}</div>
    </div>
  );
}

export function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-white/85">{label}</span>
      <input
        className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-white/20 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.18)]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </label>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon,
  accent = "violet",
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent?: "violet" | "cyan" | "emerald" | "fuchsia" | "amber";
}) {
  const tone =
    accent === "cyan"
      ? "from-cyan-400/22 to-blue-500/8"
      : accent === "emerald"
      ? "from-emerald-400/22 to-lime-500/8"
      : accent === "fuchsia"
      ? "from-fuchsia-400/22 to-violet-500/8"
      : accent === "amber"
      ? "from-amber-300/22 to-rose-400/8"
      : "from-violet-500/22 to-fuchsia-500/8";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/55">{label}</div>
          <div className="text-white/70">{icon}</div>
        </div>
        <div className="mt-2 text-xl font-semibold tracking-tight text-white/90">
          {value}
        </div>
        <div className="mt-1 text-xs text-white/45">{hint}</div>
      </div>
    </div>
  );
}

export function ConfidenceBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* Icons */
export function IconPaw() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="text-white/85"
    >
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

export function IconHeart() {
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
export function IconWave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconMove() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M4 14c4-8 8 8 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 18c4-6 8 6 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
export function IconBark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M5 12v-2a3 3 0 0 1 3-3h1l2-2h2l2 2h1a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7 12v5a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 13h-1M20 13h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
export function IconSmile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M8.5 14.5c.9 1.2 2.1 2 3.5 2s2.6-.8 3.5-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
export function IconCalm() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 16c1 .8 2.4 1.3 4 1.3s3-.5 4-1.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
export function IconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12 9v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M10.3 4.6 2.9 18a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
