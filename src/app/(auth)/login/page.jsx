"use client";
import React from "react";
import Logo from "@/components/common/logo";
import LoginForm from "@/components/login/loginForm";
import HeroSection from "@/components/login/heroSection";

export default function Page() {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col items-center justify-center w-3/5 p-8 bg-blue-50">
        <Logo />
        <LoginForm />
      </div>
      <HeroSection />
    </div>
  );
}
