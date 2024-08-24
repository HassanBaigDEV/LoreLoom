// components/MainContent.js
import React from "react";
import Image from "next/image";
import cover from "@/assets/images/boyanddog.webp";
import StoryIcon from "@/assets/images/story.svg"; // Import the SVG as a React component

const MainContent = () => {
  const stories = [
    {
      title: "The Nature Around",
      author: "Ben",
      cover: cover,
      icon: <StoryIcon className="w-10" />, // Use the SVG component here
    },
    {
      title: "The Nature Around",
      author: "Ben",
      cover: cover,
      icon: <StoryIcon className="w-10" />, // Use the SVG component here
    },
    {
      title: "The Nature Around",
      author: "Ben",
      cover: cover,
      icon: <StoryIcon className="w-10" />, // Use the SVG component here
    },
    {
      title: "The Nature Around",
      author: "Ben",
      cover: cover,
      icon: <StoryIcon className="w-10" />, // Use the SVG component here
    },
    // Add more stories as needed
  ];

  return (
    <main className="flex flex-col min-h-screen">
      <div className="text-center text-gray-700">
        <h1 className="mt-32 text-6xl font-bold">Discover</h1>
        <p className="mt-5 text-gray-700 font-['Arial', sans-serif] text-lg">
          Discover Unleash the storyteller within! Explore our curated
          collection of <br /> customer-created tales, from heartwarming family
          memories to <br /> thrilling adventures. With StoryBook, the world is
          your <br />
          playground. Join our community of story crafters today!
        </p>
      </div>
      <section className="m-32">
        <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <div key={index} className="relative block w-full">
              <Image
                src={story.cover}
                className="w-full h-auto mx-auto rounded-3xl brightness-75"
              />
              <div className="absolute p-2 bg-green-500 bg-opacity-50 top-2 right-2 rounded-xl">
                {story.icon} {/* Use the SVG component */}
              </div>
              <div className="absolute flex justify-between p-2 text-white bg-opacity-40 rounded-xl bottom-2 left-2 right-2">
                <button className="px-3 py-1 text-sm text-white bg-green-500 bg-opacity-50 rounded-xl">
                  <h1 className="font-bold">{`"${story.title}"`}</h1>
                  <p className="text-xs">Read story by {story.author}</p>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default MainContent;
