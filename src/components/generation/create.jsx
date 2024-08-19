import React from "react";
import CategoryButton from "@/components/generation/button";
import {
  TextInput,
  TextAreaInput,
  SelectInput,
} from "@/components/generation/form";
import UpgradeBanner from "@/components/generation/banner";

export default function CreateStory() {
  const categories = [
    "Sci-Fi",
    "Jamaican",
    "Adventure",
    "Mystery",
    "Animal",
    "Inspirational",
  ];
  const ageOptions = ["3-5 years", "6-8 years", "9-12 years", "13+ years"];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="mt-32 mb-8 text-4xl font-semibold text-gray-800 text-bold">
        Create Story
      </h1>
      <div className="grid grid-cols-2 gap-8">         
        <div className="space-y-8">
        <p className="mb-6 text-gray-600">
        Select a story type and enter the details in the form provided to <br />
        start crafting your story today.
      </p>
          <div className="grid grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="flex justify-center">
                <CategoryButton
                  label={category}
                />
              </div>
            ))}
          </div>
          <UpgradeBanner />
        </div>

        <div className="p-8 bg-white rounded-lg">
          <p className="text-xs text-gray-800">
            Type the title of your story and a brief plot for your story in the
            provided text boxes <br />
            below, being sure to keep it under 80 characters and be very
            descriptive.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6 mb-8">
            <TextInput label="Title" placeholder="Enter title" maxLength={80} />
            <SelectInput label="Age" options={ageOptions} />
          </div>
          <TextAreaInput
            label="Plot"
            placeholder="Enter plot here"
            maxLength={1739}
          />
          <button className="w-full py-3 mt-6 text-gray-700 transition duration-300 bg-gray-300 rounded-lg hover:bg-gray-400">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
