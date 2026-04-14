"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  value: number;
  suffix: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 50, suffix: "+", label: "Active Listings" },
  { value: 3, suffix: "D", label: "Immersive Tours" },
  { value: 2, suffix: " min", label: "Avg. Capture Time" },
  { value: 100, suffix: "%", label: "Photorealistic" },
];

export default function StatsBar() {
  const ref = useRef<HTMLElement | null>(null);
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState<number[]>(() => STATS.map(() => 0));

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    const durationMs = 1250;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValues(STATS.map((stat) => Math.round(stat.value * eased)));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [started]);

  return (
    <section ref={ref} className="px-5 pb-10 md:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111111] md:grid-cols-4">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center border-white/10 px-5 py-7 text-center odd:border-r md:border-r last:border-r-0"
          >
            <p className="text-3xl font-extrabold tracking-tight text-[#1A56DB] md:text-4xl">
              {values[index]}
              {stat.suffix}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400 md:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
