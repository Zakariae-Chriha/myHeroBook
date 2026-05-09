import HeroSection from '../components/sections/HeroSection.jsx'
import HowItWorksSection from '../components/sections/HowItWorksSection.jsx'
import SamplePagesSection from '../components/sections/SamplePagesSection.jsx'
import PricingSection from '../components/sections/PricingSection.jsx'
import TestimonialsSection from '../components/sections/TestimonialsSection.jsx'
import FAQSection from '../components/sections/FAQSection.jsx'
import UniqueSection from '../components/sections/UniqueSection.jsx'

export default function Landing() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <HowItWorksSection />
      <UniqueSection />
      <SamplePagesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
    </main>
  )
}
