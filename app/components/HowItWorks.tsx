"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Step = {
  title: string;
  description: string;
  icon: ReactNode;
};

const STEPS: Step[] = [
  {
    title: "Agent Films Property",
    description: "2-3 min iPhone walkthrough captures the complete interior.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="14" height="12" rx="2" />
        <path d="m17 10 4-2v8l-4-2" />
      </svg>
    ),
  },
  {
    title: "AI Processes the Scene",
    description: "Gaussian Splatting generation runs through Luma AI pipelines.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3" />
      </svg>
    ),
  },
  {
    title: "3D Tour Goes Live",
    description: "Viewable in browser instantly, no app download required.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    title: "You Walk Through It",
    description: "Explore a realistic space from anywhere in full 3D freedom.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
];

const DELAYS = ["delay-0", "delay-100", "delay-200", "delay-300"];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState<boolean[]>(() => STEPS.map(() => false));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-step]"));

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = [...prev];
          let changed = false;

          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.getAttribute("data-step"));
              if (!Number.isNaN(idx) && !next[idx]) {
                next[idx] = true;
                changed = true;
              }
            }
          }

          return changed ? next : prev;
        });
      },
      { threshold: 0.22 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="px-5 py-18 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.18em] text-[#60a5fa]">How WebbHeads Works</p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-5xl">
          From video capture to photorealistic 3D tour in minutes
        </h2>

        <div className="relative mt-10 grid gap-5 md:grid-cols-4 md:gap-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-linear-to-r from-[#1A56DB]/0 via-[#1A56DB]/60 to-[#1A56DB]/0 md:block" />

          {STEPS.map((step, index) => (
            <article
              key={step.title}
              data-step={index}
              className={[
                "relative rounded-2xl border border-white/10 bg-[#0f1218] p-5 transition-all duration-700",
                DELAYS[index],
                visible[index]
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0",
              ].join(" ")}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1A56DB]/20 text-[#60a5fa]">
                {step.icon}
              </div>
              <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1A56DB]/45 text-xs font-bold text-[#93c5fd]">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
