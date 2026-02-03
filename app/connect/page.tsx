"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Dot,
  PageShell,
  Pill,
  PrimaryButton,
  SecondaryButton,
} from "../_components/ds";

type StepKey = "power" | "bluetooth" | "pair";

export default function ConnectPage() {
  const [done, setDone] = useState<Record<StepKey, boolean>>({
    power: false,
    bluetooth: false,
    pair: false,
  });

  const allDone = useMemo(() => Object.values(done).every(Boolean), [done]);

  function startPairing() {
    setDone({ power: false, bluetooth: false, pair: false });
    setTimeout(() => setDone((p) => ({ ...p, power: true })), 500);
    setTimeout(() => setDone((p) => ({ ...p, bluetooth: true })), 1200);
    setTimeout(() => setDone((p) => ({ ...p, pair: true })), 1900);
  }

  return (
    <PageShell
      rightSlot={
        <div className="flex items-center gap-2">
          <SecondaryButton href="/setup">Back</SecondaryButton>
          <SecondaryButton href="/">Home</SecondaryButton>
        </div>
      }
    >
      <section className="mx-auto max-w-xl px-6 pb-16">
        {/* extra glow behind the card */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-cyan-400/15 blur-2xl" />

          <Card accent="fuchsia">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(168,85,247,0.65)]" />
              Step 2 of 3 <Dot /> Connect collar
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white/90">
              Ready to connect
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Make sure your collar is powered on and nearby.
            </p>

            <div className="mt-6 grid gap-3">
              <ChecklistRow
                title="Power on device"
                desc="Turn the collar on"
                done={done.power}
              />
              <ChecklistRow
                title="Enable Bluetooth"
                desc="Allow Bluetooth access"
                done={done.bluetooth}
              />
              <ChecklistRow
                title="Pair and Sync"
                desc="Connect and verify"
                done={done.pair}
              />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PrimaryButton onClick={startPairing}>
                Start pairing <span className="ml-2 opacity-90">✦</span>
              </PrimaryButton>

              <div className="text-xs text-white/55">
                Demo flow — later this will be real Bluetooth checks.
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <div className="text-xs text-white/55">Next: your dashboard</div>

              <PrimaryButton href="/dashboard" disabled={!allDone}>
                Continue →
              </PrimaryButton>
            </div>
          </Card>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone="cyan" label="Bluetooth" />
          <Pill tone="violet" label="Fast pairing" />
          <Pill tone="fuchsia" label="Realtime sync" />
        </div>
      </section>
    </PageShell>
  );
}

function ChecklistRow({
  title,
  desc,
  done,
}: {
  title: string;
  desc: string;
  done: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border p-4 transition",
        done
          ? "border-violet-400/25 bg-violet-400/10"
          : "border-white/10 bg-white/5 hover:bg-white/7",
      ].join(" ")}
    >
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white/90">{title}</div>
        <div className="text-xs text-white/55">{desc}</div>
      </div>

      <div
        className={[
          "grid h-9 w-9 place-items-center rounded-2xl border text-xs",
          done
            ? "border-violet-400/25 bg-white/5 text-violet-200"
            : "border-white/12 bg-white/5 text-white/55",
        ].join(" ")}
      >
        {done ? "✓" : "…"}
      </div>
    </div>
  );
}
