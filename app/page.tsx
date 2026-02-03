"use client";
import { PageShell, Card, Pill, PrimaryButton, SecondaryButton } from "./_components/ds";

export default function LandingPage() {
  return (
    <PageShell subtitle="The Evolution of Pet Tech">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left">
            <Pill tone="violet" label="v2.0 AI IoT Dashboard" />
            <h1 className="mt-8 text-[84px] font-[1000] text-white leading-[0.9] tracking-[-0.04em]">
              Understand <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Your Dog</span><br/>
              Better.
            </h1>
            <p className="mt-10 text-xl text-white/50 leading-relaxed max-w-lg">
              DogSense combines advanced ESP32 sensors with deep-learning AI to translate your dog's movements and vitals into emotional insights.
            </p>
            <div className="mt-12 flex gap-5">
              <PrimaryButton href="/login">GET STARTED</PrimaryButton>
              <SecondaryButton href="https://github.com/asafkad123-hub/iot-site">DOCUMENTATION</SecondaryButton>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <Card accent="violet" className="mt-12">
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter">AI Emotion</h3>
              <p className="mt-2 text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Neural networks identifying behavioral patterns 24/7.</p>
            </Card>
            <Card accent="cyan">
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Real-time</h3>
              <p className="mt-2 text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Instant telemetry from the collar to your personal dashboard.</p>
            </Card>
            <Card accent="emerald">
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Wellness</h3>
              <p className="mt-2 text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Early detection of stress or physical fatigue.</p>
            </Card>
            <Card accent="fuchsia" className="-mt-12">
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Connectivity</h3>
              <p className="mt-2 text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Global access to your pet's data via secure cloud.</p>
            </Card>
          </div>
        </div>
      </section>
    </PageShell>
  );
}