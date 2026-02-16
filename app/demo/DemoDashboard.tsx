"use client";

import { useState, useEffect } from "react";
import {
  PageShell,
  Card,
  Metric,
  IconHeart,
  IconMove,
  IconBark,
  IconSmile,
  ConfidenceBar,
  Pill,
  SecondaryButton,
} from "../_components/ds";

// --- Animated Dog Display Component ---
function AnimatedDog({ emotion, activityState, isBarking }: { emotion: string; activityState: string; isBarking: boolean }) {
  const getDogImage = () => {
    const emo = emotion.toLowerCase();
    const state = activityState.toLowerCase();
    return `/images/dog_${state}_${emo}.png`;
  };

  const currentImage = getDogImage();

  return (
    <div className="relative w-full h-64 sm:h-96 flex items-center justify-center overflow-hidden rounded-3xl bg-[#05060b] border border-white/5 mb-8 shadow-2xl group">
      
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 z-0">
         <img 
          key={`bg-${currentImage}`}
          src={currentImage} 
          alt=""
          className="w-full h-full object-contain scale-150 blur-[80px] opacity-30 transition-all duration-1000"
        />
        <div className={`absolute inset-0 opacity-20 transition-colors duration-1000 ${
          emotion === 'Happy' ? 'bg-yellow-400' : 
          emotion === 'Angry' ? 'bg-red-500' : 
          emotion === 'Sad' ? 'bg-blue-400' : 'bg-emerald-400'
        }`} />
      </div>

      <img 
        key={currentImage} 
        src={currentImage} 
        alt={`Dog visualization`}
        className={`h-56 sm:h-72 w-auto object-contain transition-all duration-700 ease-in-out relative z-10 
          filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]
          ${isBarking ? 'animate-pulse scale-105' : 'hover:scale-105'}
        `}
        style={{ imageRendering: 'auto' }}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          if (target.src.indexOf('sitting_calm') === -1) {
            target.src = "/images/dog_sitting_calm.png";
          }
        }}
      />
      
      {isBarking && (
        <div className="absolute top-8 right-12 animate-bounce z-20">
          <IconBark className="w-12 h-12 text-white/70 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05060b] to-transparent z-15" />
    </div>
  );
}

// --- Reusable UI Parts ---

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-violet-500/50 transition-all">
      <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-base font-black text-white/70 outline-none"
      />
    </div>
  );
}

function SliderField({ label, value, min, max, onChange, displayValue, accentColor = "accent-fuchsia-500" }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-inner group transition-all hover:bg-white/[0.06]">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] group-hover:text-white/50 transition-colors">{label}</div>
        <div className="text-xs font-bold text-fuchsia-400">{displayValue}</div>
      </div>
      <input
        type="range" min={min} max={max} value={value} step="1"
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer ${accentColor} transition-opacity opacity-90 hover:opacity-100`}
      />
    </div>
  );
}

// --- Main Page ---

export default function DemoDashboard() {
  const activityStates = ["Lying", "Sitting", "Standing", "Moving"];
  const barkTypes = ["Sad", "Calm", "Happy", "Angry"];

  const [profile, setProfile] = useState({ name: "Buddy", breed: "Golden Retriever", age: "3", weight: "25" });
  const [metrics, setMetrics] = useState({ heartRate: 85, hrv: 65, activityIdx: 1, isBarking: false, barkTypeIdx: 1 });
  const [prediction, setPrediction] = useState({ emotion: "Calm", confidencePct: 88 });

  useEffect(() => {
    // 1. נרמול נתוני פרופיל (Age & Weight)
    const ageFactor = Math.min(Number(profile.age) || 0, 15) / 15; // כלב מבוגר יותר נוטה לפחות עוררות
    const weightFactor = Math.min(Number(profile.weight) || 0, 50) / 50; // כלב כבד יותר מתעייף מהר יותר

    // 2. חישוב Arousal (רמת עוררות / אנרגיה)
    // בסיס: דופק. השפעות: תנועה (+), נביחה (++), גיל (-)
    let arousal = (metrics.heartRate - 60) / 140; 
    arousal += (metrics.activityIdx * 0.12); // תנועה מעלה עוררות
    if (metrics.activityIdx === 0) arousal -= 0.1; // שכיבה מורידה עוררות
    if (metrics.isBarking) arousal += 0.35; // נביחה היא אקשן חזק
    arousal -= (ageFactor * 0.15); // התאמת גיל

    // 3. חישוב Valence (נעימות / רגש חיובי מול שלילי)
    // בסיס: HRV. השפעות: דופק קיצוני (-), סוג נביחה (+/-)
    let valence = (metrics.hrv / 150); 
    
    // השפעת דופק על Valence (סטרס)
    if (metrics.heartRate > 150) valence -= 0.15;
    if (metrics.heartRate < 50) valence -= 0.1;

    // השפעת סוג הנביחה
    if (metrics.isBarking) {
      const type = barkTypes[metrics.barkTypeIdx];
      if (type === "Happy") valence += 0.3;
      if (type === "Angry") valence -= 0.5;
      if (type === "Sad") valence -= 0.3;
      if (type === "Calm") valence += 0.1;
    }

    // השפעת משקל (כלב כבד במאמץ גבוה מרגיש פחות בנוח)
    if (weightFactor > 0.7 && metrics.activityIdx > 2) valence -= 0.1;

    // 4. קביעת הרגש הסופי לפי Russell Model (Mapping 2D)
    let emo = "Calm";
    if (valence >= 0.5) {
      emo = arousal >= 0.45 ? "Happy" : "Calm";
    } else {
      emo = arousal >= 0.45 ? "Angry" : "Sad";
    }

    // 5. חישוב Confidence (ביטחון המודל)
    // ככל שהערכים רחוקים מהמרכז (0.5), המודל בטוח יותר. הוספנו "רעש" קטן למראה ריאליסטי.
    const certainty = Math.abs(valence - 0.5) + Math.abs(arousal - 0.5);
    const noise = (Math.sin(Date.now() / 1000) * 2); // תנודה קלה בנתונים
    const finalConf = Math.min(Math.max(Math.round(65 + (certainty * 40) + noise), 61), 99);

    setPrediction({ 
      emotion: emo, 
      confidencePct: finalConf
    });
  }, [metrics, profile]); // המנגנון רץ גם כשמשנים פרופיל!

  const getEmotionColor = () => {
    switch(prediction.emotion) {
      case "Happy": return "text-yellow-400 shadow-yellow-500/20";
      case "Angry": return "text-red-500 shadow-red-500/20";
      case "Sad": return "text-blue-400 shadow-blue-500/20";
      case "Calm": return "text-emerald-400 shadow-emerald-500/20";
      default: return "text-fuchsia-400 shadow-fuchsia-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-white font-sans selection:bg-fuchsia-500/30 pb-20">
      <PageShell subtitle="AI Lab Simulator" rightSlot={<div className="flex items-center gap-3"><Pill tone="cyan" label="V2 ACTIVE" /><SecondaryButton onClick={() => (window.location.href = "/")}>Exit</SecondaryButton></div>}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-12">
          
          <Card accent="violet" className="mb-8">
            <div className="text-xl font-black mb-4 uppercase tracking-tighter text-white/80">Dog Profile</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <EditableField label="Name" value={profile.name} onChange={(val) => setProfile({...profile, name: val})} />
              <EditableField label="Breed" value={profile.breed} onChange={(val) => setProfile({...profile, breed: val})} />
              <EditableField label="Age" value={profile.age} onChange={(val) => setProfile({...profile, age: val})} />
              <EditableField label="Weight (kg)" value={profile.weight} onChange={(val) => setProfile({...profile, weight: val})} />
            </div>
          </Card>

          <AnimatedDog 
            emotion={prediction.emotion} 
            activityState={activityStates[metrics.activityIdx]} 
            isBarking={metrics.isBarking} 
          />

          <div className="mb-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Live Biometrics Simulator</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <SliderField label="Heart Rate" value={metrics.heartRate} min={40} max={220} displayValue={`${metrics.heartRate} BPM`} onChange={(val:any) => setMetrics({...metrics, heartRate: val})} />
            <SliderField label="HRV" value={metrics.hrv} min={10} max={150} displayValue={`${metrics.hrv} ms`} onChange={(val:any) => setMetrics({...metrics, hrv: val})} />
            <SliderField label="Activity" value={metrics.activityIdx} min={0} max={3} displayValue={activityStates[metrics.activityIdx]} onChange={(val:any) => setMetrics({...metrics, activityIdx: val})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <button 
              onClick={() => setMetrics({...metrics, isBarking: !metrics.isBarking})}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-4 font-black tracking-widest text-sm ${
                metrics.isBarking 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              <IconBark className={metrics.isBarking ? "animate-pulse" : ""} />
              {metrics.isBarking ? "BARKING: ACTIVE" : "BARKING: SILENT"}
            </button>

            {metrics.isBarking && (
              <SliderField label="Bark Flavor" value={metrics.barkTypeIdx} min={0} max={3} accentColor="accent-violet-500" displayValue={`Mood: ${barkTypes[metrics.barkTypeIdx]}`} onChange={(val:any) => setMetrics({...metrics, barkTypeIdx: val})} />
            )}
          </div>

          <Card accent="fuchsia" className="mb-10 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
              <div className={`w-fit p-6 bg-white/[0.05] rounded-3xl transition-all ${getEmotionColor()} shadow-2xl`}><IconSmile /></div>
              <div className="flex-1">
                <div className={`text-6xl font-black uppercase tracking-tighter leading-none ${getEmotionColor()}`}>{prediction.emotion}</div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] mt-4 flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                  </span>
                  Neural Russell-Model Analysis Active
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em] mb-1">AI Confidence Score</div>
                <div className="text-5xl font-black text-white/90 leading-none">{prediction.confidencePct}%</div>
              </div>
            </div>
            <div className="mt-12"><ConfidenceBar pct={prediction.confidencePct} /></div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70 hover:opacity-100 transition-opacity">
            <Metric label="BPM" value={metrics.heartRate} icon={<IconHeart />} />
            <Metric label="HRV" value={metrics.hrv} icon={<IconHeart />} />
            <Metric label="Activity" value={activityStates[metrics.activityIdx]} icon={<IconMove />} />
            <Metric label="Barking" value={metrics.isBarking ? barkTypes[metrics.barkTypeIdx] : "None"} icon={<IconBark />} />
          </div>
        </div>
      </PageShell>
    </div>
  );
}