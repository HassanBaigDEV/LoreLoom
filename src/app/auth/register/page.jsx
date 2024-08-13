// pages/signup/page.js
import React from "react";
import HeroImage from "../../../components/register/heroSection";
import Logo from "../../../components/common/logo";
import SignupForm from "../../../components/register/SignupForm";
import HelpButton from "../../../components/common/help";

export default function Page() {
  return (
    <div className="flex h-screen">
      <HeroImage />
      <div className="flex flex-col items-center justify-center w-3/6 p-8 bg-blue-50">
        <Logo />
        <SignupForm />
      </div>
      <HelpButton />
    </div>
  );
}
