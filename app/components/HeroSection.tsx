export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pb-20 pt-28 md:px-8">
      <div className="absolute inset-0">
        <div className="mesh-glow absolute left-1/2 top-1/2 h-128 w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(26,86,219,0.25),rgba(76,29,149,0.16)_42%,rgba(7,10,18,0)_72%)]" />
        <div className="mesh-glow-delayed absolute left-1/2 top-1/2 h-184 w-184 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.2),rgba(26,86,219,0.05)_45%,rgba(8,8,8,0)_74%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <p className="hero-reveal text-sm uppercase tracking-[0.22em] text-slate-400">WebbHeads, Vishakhapatnam</p>
        <h1 className="hero-reveal-delay mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-7xl">
          Find Your Home in
          <span className="block bg-linear-to-r from-[#1A56DB] via-[#4f46e5] to-[#7c3aed] bg-clip-text font-extrabold text-transparent">
            Photorealistic 3D
          </span>
        </h1>

        <p className="hero-reveal-delay-2 mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-300 md:text-xl">
          Vishakhapatnam&apos;s first property platform with immersive 3D Gaussian Splat walkthroughs. See
          every corner before you visit.
        </p>

        <div className="hero-reveal-delay-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#properties"
            className="inline-flex min-w-44 items-center justify-center rounded-full bg-[#1A56DB] px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:bg-[#2b66eb]"
          >
            Explore Properties
          </a>
          <a
            href="#tours"
            className="inline-flex min-w-44 items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-[#1A56DB] hover:text-white"
          >
            Watch Demo
          </a>
        </div>

        <p className="hero-reveal-delay-3 mt-5 text-sm text-slate-400">
          Trusted by 50+ property seekers in Vishakhapatnam
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="glass-card hero-reveal-delay-3 flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 md:text-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#60a5fa]" fill="currentColor" aria-hidden="true">
            <path d="m12 2 1.6 4.5L18 8l-4.4 1.5L12 14l-1.6-4.5L6 8l4.4-1.5L12 2Z" />
            <path d="m19 13 .9 2.5L22 16.3l-2.1.7L19 19l-.9-2L16 16.3l2.1-.8L19 13Z" />
          </svg>
          3D Gaussian Splatting
        </div>
      </div>
    </section>
  );
}
