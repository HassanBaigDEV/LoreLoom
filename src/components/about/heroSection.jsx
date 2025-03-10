import React from "react";
import Image from "next/image";
import plot from "@/assets/images/plot_screen.webp";

export default function HeroSection() {
  return (
    <section className="flex justify-center flex-grow">
      <div className="text-center text-gray-800">
        <h1 className="mt-20 text-5xl font-bold">
          Crafting Your Story <br /> with StoryWeaver
        </h1>
        <p className="font-bold mt-5 text-black font-['Arial', sans-serif] text-lg">
          Are you ready to unleash your creativity and craft your own <br />
          incredible story? With StoryWeaver, it's easier than ever to <br />
          bring your ideas to life and share them with the world.
        </p>
        <Image
          src={plot}
          className="relative w-3/5 h-auto mx-auto"
          alt="Plot screen"
          width={800}
          height={600}
        />
      </div>
    </section>
  );
}
