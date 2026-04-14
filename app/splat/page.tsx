"use client";

import dynamic from "next/dynamic";

const GaussianViewer = dynamic(() => import("@/components/GaussianViewer"), {
  ssr: false,
});

export default function SplatDemoPage() {
  const splatUrl = process.env.NEXT_PUBLIC_SPLAT_URL || "/room.ply";

  return (
    <main className="min-h-screen w-full bg-[#080808] p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <GaussianViewer
          splatUrl={splatUrl}
          height={600}
          splatAlphaRemovalThreshold={10}
          onLoad={() => {
            console.log("Splat loaded successfully");
          }}
        />

        <section className=" border border-white/10 bg-[#111318] p-5 text-slate-200 md:p-7">
          <h2 className="text-xl font-semibold tracking-wide text-white md:text-2xl">
            Simulation Control Manual
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
            Explore the property like a walkthrough. Use mouse and keyboard together for the smoothest
            experience.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className=" border border-cyan-300/20 bg-cyan-500/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">
                Mouse Controls
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>
                  <span className="font-medium text-white">Left Click + Drag:</span> Rotate camera
                </li>
                <li>
                  <span className="font-medium text-white">Scroll:</span> Zoom in and out
                </li>
                <li>
                  <span className="font-medium text-white">Right Click + Drag:</span> Pan across the scene
                </li>
              </ul>
            </article>

            <article className=" border border-emerald-300/20 bg-emerald-500/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-200">
                Keyboard Controls
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>
                  <span className="font-medium text-white">W / S:</span> Move forward and backward
                </li>
                <li>
                  <span className="font-medium text-white">A / D:</span> Strafe left and right
                </li>
                <li>
                  <span className="font-medium text-white">Arrow Keys:</span> Look around (yaw and pitch)
                </li>
                <li>
                  <span className="font-medium text-white">Shift:</span> Sprint / move faster
                </li>
                <li>
                  <span className="font-medium text-white">M:</span> Toggle keyboard navigation in hybrid mode
                </li>
              </ul>
            </article>
          </div>

          <div className="mt-4 border border-amber-300/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
            Tip: If controls feel stuck, click once on the viewer and then use the keys again.
          </div>

          <div className="mt-4 border border-white/10 bg-white/5 p-4 text-xs text-slate-400 md:text-sm">
            Asset Source: {splatUrl}
          </div>
        </section>
      </div>
    </main>
  );
}
