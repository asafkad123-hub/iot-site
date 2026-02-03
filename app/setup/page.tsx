"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Field,
  PageShell,
  Pill,
  PrimaryButton,
  SecondaryButton,
} from "../_components/ds";

export default function SetupPage() {
  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");

  const canContinue = useMemo(
    () => dogName.trim().length > 0 && breed.trim().length > 0,
    [dogName, breed]
  );

  return (
    <PageShell
      rightSlot={
        <div className="flex items-center gap-2">
          <SecondaryButton href="/">Home</SecondaryButton>
        </div>
      }
    >
      <section className="mx-auto max-w-xl px-6 pb-16">
        <Card accent="violet">
          <div className="mb-3 inline-flex items-center gap-2">
            <Pill tone="violet" label="Step 1 of 3" />
            <Pill tone="cyan" label="Dog profile" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white/90">
            Tell us about your dog
          </h1>
          <p className="mt-2 text-sm text-white/60">
            One-time setup. Later we’ll take you straight to your dashboard.
          </p>

          <div className="mt-6 grid gap-4">
            <Field
              label="Dog's name"
              placeholder="e.g. Milo"
              value={dogName}
              onChange={setDogName}
            />
            <Field
              label="Breed"
              placeholder="e.g. Border Collie"
              value={breed}
              onChange={setBreed}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Age"
                placeholder="e.g. 3"
                value={age}
                onChange={setAge}
                type="number"
              />
              <Field
                label="Weight"
                placeholder="e.g. 18"
                value={weight}
                onChange={setWeight}
                type="number"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-white/55">Next: connect your collar</div>
            <PrimaryButton href="/connect" disabled={!canContinue}>
              Continue
            </PrimaryButton>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
