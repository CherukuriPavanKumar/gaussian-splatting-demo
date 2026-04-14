const TRADITIONAL_TOUR_LIMITS = [
  "360 photos only",
  "Fixed camera positions",
  "Feels disconnected from real space",
  "Slow setup and expensive workflows",
];

const WebbHeads_ADVANTAGES = [
  "Photorealistic depth and materials",
  "Free movement in true 3D",
  "Captured in minutes",
  "Runs on all modern devices",
];

export default function TechSection() {
  return (
    <section id="tours" className="px-5 py-18 md:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#0d1117] p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-[#60a5fa]">Powered by Cutting-Edge Tech</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-5xl">Built on the future of 3D</h2>
          <p className="mt-4 text-slate-400">
            WebbHeads uses Gaussian Splatting, the same frontier-grade rendering approach powering the next
            wave of AI-native 3D experiences.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              "3D Gaussian Splatting",
              "Spark.js",
              "Luma AI",
              "Cloudflare R2",
            ].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[#1A56DB]/45 bg-[#1A56DB]/12 px-3 py-1 text-xs font-medium text-[#bfdbfe]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#0a0d12] p-5">
            <h3 className="text-lg font-semibold text-slate-200">Traditional Virtual Tours</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {TRADITIONAL_TOUR_LIMITS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[#1A56DB]/40 bg-linear-to-b from-[#10203f] to-[#0a1326] p-5 shadow-[0_0_0_1px_rgba(26,86,219,0.28),0_18px_50px_rgba(10,20,40,0.6)]">
            <h3 className="text-lg font-semibold text-white">WebbHeads 3D Tours</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {WebbHeads_ADVANTAGES.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-cyan-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
