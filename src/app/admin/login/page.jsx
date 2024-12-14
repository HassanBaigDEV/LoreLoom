"use client";
import React from "react";
import AdminLoginForm from "@/components/admin/login/loginForm";
import HeroSection from "@/components/login/heroSection";

export default function AdminLoginPage() {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col items-center justify-center lg:w-3/5 md:w-3/5 p-8">
        <AdminLoginForm />
      </div>
      <HeroSection />
    </div>
  );
} 