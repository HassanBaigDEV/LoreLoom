// components/HeroImage.js
import React from "react";
import Image from "next/image";
import signup from "@/assets/images/signup.png";

export default function HeroImage() {
  return (
    <div className="relative w-3/6">
      <Image
        src={signup}
        alt="Signup"
        className="object-cover w-full h-full brightness-75"
      />
      <div className="absolute p-4 text-white rounded bottom-5 left-5">
        <h1 className="font-bold text-7xl">
          Bring
          <br />
          Bedtime
          <br />
          to life..
        </h1>
      </div>
    </div>
  );
}
