// components/FeatureSection.js
import React from "react";
import Image from "next/image";
import dash from "@/assets/images/Dashboardv2.png";
import Lightning from "@/assets/images/lightning.svg";
import img1 from "@/assets/images/girlinspaceship.png";
import img2 from "@/assets/images/girl-hiding-in-bushes.png";
import img3 from "@/assets/images/mother-and-son-flying.png";
import wave from "@/assets/images/Audio-wave.png";

export default function FeatureSection() {
  return (
    <div className="text-center text-gray-700">
      <h1 className="mt-20 text-6xl font-bold">
        Welcome to <br /> Loreloom
      </h1>
      <p className="font-bold mt-5 text-gray-500 text-lg font-['Arial', sans-serif]">
        Our AI-powered story generator, that <br /> can take that spark and turn
        it into an incredible tale in just one <br /> minute.
      </p>
      <Image src={dash} className="relative w-3/6 h-auto mx-auto" />
      <div className="grid w-3/5 grid-cols-2 gap-4 pl-20 pr-20 mx-auto mt-8">
        {/* Feature Card 1 */}
        <div className="relative w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
          <h1 className="text-2xl font-bold leading-tight text-amber-500">
            Generate stories within 60 seconds
          </h1>
          <p className="pt-5 text-xl text-gray-600">
            Our AI story generator is lightning-fast, allowing you to create
            unique and engaging stories in seconds. Whether you're looking to
            craft a captivating tale to share with friends or want to develop
            your storytelling skills, our intuitive tools make it easy to create
            stories that are as compelling as they are entertaining.
          </p>
          <Lightning className="absolute w-1/6 h-auto bottom-5 right-4" />
        </div>
        {/* Feature Card 2 */}
        <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
          <h1 className="text-2xl font-bold leading-tight text-blue-500">
            Discover
          </h1>
          <p className="pt-5 text-xl text-gray-600">
            Looking for inspiration or just want to see what others are
            creating? Our platform allows you to browse and read stories from
            other users, giving you access to a wealth of incredible tales and
            creative ideas.
          </p>
          <div className="relative flex justify-center w-full h-auto mx-auto mt-5">
            <Image
              src={img1}
              className="absolute z-20 w-3/6 h-auto rounded-3xl left-2/4"
            />
            <Image
              src={img2}
              className="absolute z-30 w-3/6 h-auto rounded-3xl left-1/4"
            />
            <Image
              src={img3}
              className="absolute left-0 z-10 w-3/6 h-auto rounded-3xl"
            />
          </div>
        </div>
      </div>
      <Image src={wave} className="relative w-full h-auto mx-auto" />
    </div>
  );
}
