export default function CTASection() {
  return (
    <section className="relative overflow-hidden px-5 py-18 md:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(26,86,219,0.25),rgba(8,8,8,0)_68%)]" />
      <div className="relative mx-auto max-w-5xl rounded-3xl border border-white/15 bg-[#0d1118]/85 p-8 text-center md:p-12">
        <h2 className="text-3xl font-extrabold text-white md:text-5xl">Ready to find your home in 3D?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          List your property or start browsing today.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#properties"
            className="inline-flex min-w-44 items-center justify-center rounded-full bg-[#1A56DB] px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:bg-[#2b66eb]"
          >
            Browse Properties
          </a>
          <a
            href="#contact"
            className="inline-flex min-w-44 items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-[#1A56DB] hover:text-white"
          >
            List My Property
          </a>
        </div>
      </div>
    </section>
  );
}
