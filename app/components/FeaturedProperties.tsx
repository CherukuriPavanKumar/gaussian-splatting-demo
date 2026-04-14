import Image from "next/image";

type Property = {
  title: string;
  location: string;
  price: string;
  stats: string;
  image: string;
};

const PROPERTIES: Property[] = [
  {
    title: "3BHK Apartment",
    location: "MVP Colony",
    price: "Rs. 1.2 Cr",
    stats: "3 bed • 2 bath • 1880 sqft",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "2BHK Flat",
    location: "Madhurawada",
    price: "Rs. 78 Lakhs",
    stats: "2 bed • 2 bath • 1240 sqft",
    image:
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "4BHK Villa",
    location: "Rushikonda",
    price: "Rs. 3.5 Cr",
    stats: "4 bed • 3 bath • 3600 sqft",
    image:
      "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function FeaturedProperties() {
  return (
    <section id="properties" className="px-5 py-18 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.18em] text-[#60a5fa]">Featured Properties</p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-5xl">Each listing includes a full 3D walkthrough</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PROPERTIES.map((property) => (
            <article
              key={property.title + property.location}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101218] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(26,86,219,0.3),0_25px_60px_rgba(0,0,0,0.35)]"
            >
              <div className="relative">
                <Image
                  src={property.image}
                  alt={property.title + " in " + property.location}
                  width={1200}
                  height={800}
                  className="h-52 w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-[#1A56DB] px-3 py-1 text-xs font-semibold text-white">
                  3D Tour Available
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-semibold text-white">
                  {property.title} — {property.location}
                </h3>
                <p className="mt-2 text-lg font-bold text-[#93c5fd]">{property.price}</p>
                <p className="mt-2 text-sm text-slate-400">{property.stats}</p>

                <a
                  href="/splat"
                  className="mt-5 inline-flex items-center rounded-full border border-[#1A56DB]/45 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-[#1A56DB]"
                >
                  View 3D Tour
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="#" className="text-sm font-semibold text-[#60a5fa] transition-colors hover:text-[#93c5fd]">
            View All Properties →
          </a>
        </div>
      </div>
    </section>
  );
}
