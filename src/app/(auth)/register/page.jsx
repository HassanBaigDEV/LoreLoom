// pages/signup/page.js
"use client";
import React from "react";
import HeroImage from "@/components/register/heroSection";
import Logo from "@/components/common/logo";
import SignupForm from "@/components/register/signupform";

export default function Page() {
  return (
    <div className="flex h-screen">
      <HeroImage />
      <div className="flex flex-col items-center justify-center w-3/5 p-8">
        {/* <Logo /> */}
        <SignupForm />
      </div>
    </div>
  );
}
