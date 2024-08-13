import React from "react";
import Header from "../../components/about/header";
import HeroSection from "../../components/about/heroSection";
import StepsSection from "../../components/about/stepSection";
import Footer from "../../components/about/footer";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <Header />
      <HeroSection />
      <StepsSection />
      <Footer />
    </div>
  );
}
