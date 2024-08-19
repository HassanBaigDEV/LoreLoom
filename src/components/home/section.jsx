// components/Hero.js
import React from "react";
import Image from "next/image";
import cover from "../../assets/images/seilala-cover.png";

export default function Hero() {
  return (
    <div className="relative w-auto">
      <Image
        src={cover}
        alt="Login"
        className="object-cover w-full h-full brightness-75"
      />
      <div className="absolute p-3 mx-auto text-center text-white bg-opacity-40 rounded-xl bottom-4 left-4 right-4">
        <h1 className="font-bold text-7xl">"A New Era of Storytelling"</h1>
        <button className="px-4 py-2 mt-4 text-white bg-green-500 bg-opacity-50 rounded-2xl">
          "The Curly Crown"
          <br />
          Read story by Kevin
        </button>
      </div>
    </div>
  );
}
