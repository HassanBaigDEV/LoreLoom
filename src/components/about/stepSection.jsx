import React from "react";
import Image from "next/image";
import typeS from "@/assets/images/story_dropdown.webp";
import ageR from "@/assets/images/ageR.webp";
import titlebar from "@/assets/images/titlebar.webp";
import plotbar from "@/assets/images/plotbar.webp";

export default function StepsSection() {
  return (
    <div className="grid grid-cols-2 gap-4 pl-20 pr-20 mt-8 mb-8">
      <Step
        text="Select the type of story you want to create. Whether you want a comic book format or a children’s storybook, we've got you covered."
        image={typeS}
        altText="Select type of story"
      />
      <Step
        text="Choose the age range for your story. This will help the AI tailor the writing style, genre, and language to ensure your story is appropriate for your target audience."
        image={ageR}
        altText="Age range"
      />
      <Step
        text="Enter the title of your story. This is your chance to grab your reader's attention, so choose something that's catchy and memorable."
        image={titlebar}
        altText="Title bar"
      />
      <Step
        text="Provide a detailed plot summary. This is where you get to let your imagination run wild and bring your story to life. Be as descriptive as possible, and don't be afraid to add twists and turns to keep your readers on the edge of their seats."
        image={plotbar}
        altText="Plot bar"
      />
    </div>
  );
}

function Step({ text, image, altText }) {
  return (
    <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
      <p className="text-lg text-gray-600">{text}</p>
      <Image
        src={image}
        className="relative w-4/6 h-auto mx-auto"
        alt={altText}
        width={800}
        height={600}
      />
    </div>
  );
}
