// pages/index.js
import React from "react";
import Header from "../components/home/header";
import Hero from "../components/home/Section";
import FeatureSection from "../components/home/feature";
import PricingSection from "../components/home/pricing";
import Footer from "../components/home/footer";
import Card from "@/components/home/card";

export default function HomePage() {
  return (
    <>
      <div className="bg-gray-50">
        <Header />
        <Hero />
        <FeatureSection />
        <PricingSection />
        <Card />
      </div>

      <Footer />
    </>
  );
}
