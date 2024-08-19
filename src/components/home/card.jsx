import React from "react";
import Image from "next/image";
import img from "@/assets/images/boyanddog.png";

export default function Card() {
  return (
    <div className="relative block w-4/6 mx-auto">
      <Image src={img} className="mx-auto rounded-3xl brightness-75" />
      <div className="absolute flex justify-between p-3 text-white bg-opacity-40 rounded-xl bottom-4 left-4 right-4">
        <button className="px-4 py-2 text-white bg-green-500 bg-opacity-50 rounded-2xl">
          <h1 className="font-bold">"The Nature Around"</h1>
          <p>Read story by Ben</p>
        </button>
      </div>
    </div>
  );
}
