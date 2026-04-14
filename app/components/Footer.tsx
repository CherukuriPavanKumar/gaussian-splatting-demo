export default function Footer() {
  return (
    <footer id="contact" className="mt-6 border-t border-white/10 bg-[#090b10] px-5 py-12 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div>
          <p className="text-2xl font-extrabold text-[#1A56DB]">WebbHeads</p>
          <p className="mt-3 max-w-sm text-sm text-slate-400">
            Premium property discovery platform for Vishakhapatnam with immersive 3D Gaussian Splat walkthroughs.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-200">Quick Links</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-white">Home</a></li>
            <li><a href="#properties" className="hover:text-white">Properties</a></li>
            <li><a href="#tours" className="hover:text-white">3D Tours</a></li>
            <li><a href="#how-it-works" className="hover:text-white">About</a></li>
            <li><a href="#contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-200">Contact</p>
          <p className="mt-3 text-sm text-slate-400">Vishakhapatnam, India</p>
          <p className="mt-1 text-sm text-slate-400">hello@WebbHeads.in</p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-5 text-xs text-slate-500">
        © 2026 WebbHeads. Built with 3D Gaussian Splatting technology.
      </div>
    </footer>
  );
}
