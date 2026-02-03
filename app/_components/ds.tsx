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
    <main className="min-h-screen bg-white text-zinc-900">
      <Bg />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <IconPaw />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{title}</div>
            <div className="text-xs text-zinc-500">{subtitle}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">{rightSlot}</div>
      </header>

      {children}

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-zinc-500">
        © {new Date().getFullYear()} DogSense <Dot /> UI prototype
      </footer>
    </main>
  );
}

export function Bg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_60%)]" />
    </div>
  );
}

export function Dot() {
  return <span className="mx-2 inline-block h-1 w-1 rounded-full bg-zinc-400 align-middle" />;
}

export function Pill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2 text-center text-xs text-zinc-600 shadow-sm">
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
    "inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold shadow-sm transition",
    disabled
      ? "pointer-events-none bg-zinc-200 text-zinc-500"
      : "bg-zinc-900 text-white hover:bg-zinc-800",
  ].join(" ");

  if (href) {
    return (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">{children}</div>;
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
      <span className="text-sm font-medium">{label}</span>
      <input
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </label>
  );
}

export function StepPill({
  done,
  title,
  subtitle,
}: {
  done: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-sm",
        done ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white",
      ].join(" ")}
    >
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
      </div>

      <div
        className={[
          "grid h-9 w-9 place-items-center rounded-2xl border",
          done ? "border-emerald-200 bg-white text-emerald-700" : "border-zinc-200 bg-white text-zinc-500",
        ].join(" ")}
      >
        {done ? <IconCheck /> : <IconDot />}
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-zinc-600">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{hint}</div>
    </div>
  );
}

export function ConfidenceBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p}%` }} />
    </div>
  );
}

/* Icons */
export function IconPaw() {
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
      <path d="M4 13h-1M20 13h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconBrain() {
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
      <path d="M9 7h6M9 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
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

export function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDot() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
      <path d="M12 12h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
