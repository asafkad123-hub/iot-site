"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type StepKey = "power" | "bluetooth" | "pair";

export default function ConnectPage() {
  const [done, setDone] = useState<Record<StepKey, boolean>>({
    power: false,
    bluetooth: false,
    pair: false,
  });

  const allDone = useMemo(() => Object.values(done).every(Boolean), [done]);

  function startPairing() {
    // סימולציה יפה: “מסתמן ירוק” אחד אחרי השני
    setDone({ power: false, bluetooth: false, pair: false });
    setTimeout(() => setDone((p) => ({ ...p, power: true })), 500);
    setTimeout(() => setDone((p) => ({ ...p, bluetooth: true })), 1200);
    setTimeout(() => setDone((p) => ({ ...p, pair: true })), 1900);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <Bg />

      <header className="mx-auto flex max-w-xl items-center justify-between px-6 py-6">
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <IconChevronLeft />
          Back
        </Link>

        <div className="text-sm font-semibold">DogSense</div>
        <div className="w-12" />
      </header>

      <section className="mx-auto max-w-xl px-6 pb-16">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Step 2 of 3 <Dot /> Connect collar
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Ready to connect</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Make sure your collar is powered on and nearby.
          </p>

          <div className="mt-6 grid gap-3">
            <ChecklistRow
              title="Power on device"
              desc="Turn the collar on"
              done={done.power}
              icon={<IconBolt />}
            />
            <ChecklistRow
              title="Enable Bluetooth"
              desc="Allow Bluetooth access"
              done={done.bluetooth}
              icon={<IconBluetooth />}
            />
            <ChecklistRow
              title="Pair and Sync"
              desc="Connect and verify"
              done={done.pair}
              icon={<IconLink />}
            />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={startPairing}
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              Start pairing
              <span className="ml-2 opacity-90">
                <IconSpark />
              </span>
            </button>

            <div className="text-xs text-zinc-500">
              Demo flow — later this will be real Bluetooth checks.
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <div className="text-xs text-zinc-500">Next: your dashboard</div>

            <Link
              href="/dashboard"
              className={[
                "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition",
                allDone
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "pointer-events-none bg-zinc-200 text-zinc-500",
              ].join(" ")}
            >
              Continue
              <span className="ml-2">
                <IconArrowRight />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChecklistRow({
  title,
  desc,
  done,
  icon,
}: {
  title: string;
  desc: string;
  done: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border p-4 shadow-sm transition",
        done
          ? "border-emerald-200 bg-emerald-50"
          : "border-zinc-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "grid h-10 w-10 place-items-center rounded-2xl border",
            done
              ? "border-emerald-200 bg-white text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-700",
          ].join(" ")}
        >
          {icon}
        </div>

        <div className="leading-tight">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-zinc-500">{desc}</div>
        </div>
      </div>

      <div
        className={[
          "grid h-9 w-9 place-items-center rounded-2xl border",
          done
            ? "border-emerald-200 bg-white text-emerald-600"
            : "border-zinc-200 bg-white text-zinc-400",
        ].join(" ")}
        aria-label={done ? "Done" : "Pending"}
      >
        {done ? <IconCheck /> : <IconClock />}
      </div>
    </div>
  );
}

function Bg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.08),transparent_60%)]" />
    </div>
  );
}

function Dot() {
  return <span className="mx-2 inline-block h-1 w-1 rounded-full bg-zinc-400 align-middle" />;
}

/* Icons */
function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 6 8 12l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 7l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function IconBluetooth() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 7l10 10-5 5V2l5 5L7 17" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
