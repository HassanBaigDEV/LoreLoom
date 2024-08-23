import React from "react";
import Image from "next/image";
import signup from "@/assets/images/signup.png";

export default function HeroSection() {
  return (
    <div className="relative w-2/5 sm:block hidden">
      <Image
        src={signup}
        alt="Login"
        className="object-cover w-full h-full brightness-75"
      />
      <div className="absolute p-4 text-white bg-gray-700 bg-opacity-50 rounded-2xl bottom-5 left-5">
        <h1 className="text-4xl font-bold">A new era of Storytelling</h1>
        <button className="px-4 py-2 mt-4 text-white bg-green-500 bg-opacity-50 rounded-2xl">
          The Book Giver
          <br />
          Read story by Kevin
        </button>
      </div>
    </div>
  );
}
