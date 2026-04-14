import CTASection from "@/app/components/CTASection";
import FeaturedProperties from "@/app/components/FeaturedProperties";
import Footer from "@/app/components/Footer";
import HeroSection from "@/app/components/HeroSection";
import HowItWorks from "@/app/components/HowItWorks";
import Navbar from "@/app/components/Navbar";
import StatsBar from "@/app/components/StatsBar";
import TechSection from "@/app/components/TechSection";
import WhyGaussianSection from "@/app/components/WhyGaussianSection";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[#080808] text-white">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <WhyGaussianSection />
      <FeaturedProperties />
      <TechSection />
      <CTASection />
      <Footer />
    </main>
  );
}
