import Hero from '@/components/home/Hero';
import SearchBox from '@/components/home/SearchBox';
import Features from '@/components/home/Features';
import KeyBenefits from '@/components/home/KeyBenefits';
import Pricing from '@/components/home/Pricing';
import ValueProposition from '@/components/home/ValueProposition';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center min-h-screen px-4 md:px-8 py-12">
      <Hero />
      <SearchBox />
      <Features />
      <KeyBenefits />
      <Pricing />
      <ValueProposition />
      <CTASection />
    </div>
  );
}