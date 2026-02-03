"use client";
import React from "react";
import Link from "next/link";

export const PageShell = ({ children, subtitle, rightSlot }: any) => (
  <div className="min-h-screen bg-[#05060a] text-slate-200 font-sans tracking-tight selection:bg-violet-500/30">
    <nav className="border-b border-white/5 bg-[#05060a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="group">
            <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
              <span className="bg-violet-600 px-2 py-0.5 rounded-lg group-hover:bg-violet-500 transition-colors">D</span>
              DogSense
            </h1>
          </Link>
          <div className="hidden md:block h-4 w-px bg-white/10" />
          <p className="hidden md:block text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">{rightSlot}</div>
      </div>
    </nav>
    <main>{children}</main>
  </div>
);

export const Card = ({ children, accent = "violet", className = "" }: any) => {
  const accents: any = {
    violet: "border-violet-500/20 shadow-violet-500/5 hover:border-violet-500/40",
    cyan: "border-cyan-500/20 shadow-cyan-500/5 hover:border-cyan-500/40",
    emerald: "border-emerald-500/20 shadow-emerald-500/5 hover:border-emerald-500/40",
    fuchsia: "border-fuchsia-500/20 shadow-fuchsia-500/5 hover:border-fuchsia-500/40",
    amber: "border-amber-500/20 shadow-amber-500/5 hover:border-amber-500/40",
  };
  return (
    <div className={`rounded-[32px] border bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-500 ${accents[accent]} ${className}`}>
      {children}
    </div>
  );
};

export const Metric = ({ label, value, icon, accent = "violet" }: any) => (
  <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 hover:bg-white/[0.03] transition-colors group">
    <div className="flex items-center gap-3 text-white/40 mb-3">
      <span className="group-hover:text-white transition-colors">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-3xl font-black text-white">{value}</div>
  </div>
);

export const ConfidenceBar = ({ pct }: { pct: number }) => (
  <div className="mt-6">
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
      <span>Confidence Level</span>
      <span>{pct}%</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 p-0.5">
      <div className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
    </div>
  </div>
);

export const PrimaryButton = ({ children, href, onClick, disabled }: any) => {
  const s = "inline-flex items-center justify-center rounded-2xl bg-white px-10 py-4 text-sm font-black text-black transition-all hover:bg-slate-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-white/10";
  return href ? <Link href={href} className={s}>{children}</Link> : <button onClick={onClick} disabled={disabled} className={s}>{children}</button>;
};

export const SecondaryButton = ({ children, href, onClick }: any) => {
  const s = "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-10 py-4 text-sm font-black text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95";
  return href ? <Link href={href} className={s}>{children}</Link> : <button onClick={onClick} className={s}>{children}</button>;
};

export const Pill = ({ label, tone }: any) => {
  const colors: any = {
    emerald: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    violet: "bg-violet-400/10 text-violet-400 border-violet-400/20",
    cyan: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  };
  return <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${colors[tone]}`}>{label}</span>;
};

export const Field = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">{label}</label>
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
    />
  </div>
);

// Icons
export const IconHeart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
export const IconWave = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12h3l2-9 4 18 4-18 2 9h3"/></svg>;
export const IconMove = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 9-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>;
export const IconBark = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 3 8 5l3 3m-2-5-2 2 2 2m10 5q-2-5-8-5t-8 5q0 5 8 5t8-5Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>;
export const IconSmile = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;