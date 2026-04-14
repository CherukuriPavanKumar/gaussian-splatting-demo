export default function WhyGaussianSection() {
  return (
    <section className="px-5 py-18 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#60a5fa]">Why Gaussian Splatting?</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight text-white md:text-6xl">
            Not photos.
            <br />
            Not videos.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300 md:text-2xl">
            A living, breathable 3D space you can walk through.
          </p>
          <div className="mt-5 h-1 w-32 rounded-full bg-linear-to-r from-[#1A56DB] to-[#4f46e5]" />
        </div>

        <div className="grid gap-4">
          {[
            {
              title: "Photorealistic",
              description: "Every room feels like standing there in person.",
            },
            {
              title: "Capture in Minutes",
              description: "Just film a walkthrough on iPhone and publish fast.",
            },
            {
              title: "Works Everywhere",
              description: "Runs smoothly in modern browsers, no app install needed.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#1A56DB]/20 bg-[#0f1117] p-5 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-[0_0_0_1px_rgba(26,86,219,0.35),0_18px_44px_rgba(10,20,40,0.4)]"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
