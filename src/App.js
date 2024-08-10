import React from "react";
import "./index.css";
import Header from "./Components/header3";

function Login() {
  return (
    <div className="bg-gray-100 App">
      <Header />
      <main className="flex flex-col min-h-screen">
        <div className="text-center text-gray-700">
          <h1 className="mt-32 text-6xl font-bold">Discover</h1>
          <p className="mt-5 text-gray-700 font-['Arial', sans-serif] text-lg">
            Discover Unleash the storyteller within! Explore our curated
            collection of <br /> customer-created tales, from heartwarming
            family memories to <br /> thrilling adventures. With StoryBook, the
            world is your <br /> playground. Join our community of story
            crafters today!
          </p>
        </div>
        <section className="m-32 ">
          <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative block w-full">
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/666736bb985227e500c29d58_a%20boy%20and%20his%20dog.jpg"
                className="w-full h-auto mx-auto rounded-3xl brightness-75"
              />
              <div className="absolute p-2 bg-green-500 bg-opacity-50 top-2 right-2 rounded-xl">
                <img
                  src="https://d7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io/f1715738840854x400331439026175800/story.svg"
                  alt="Story icon"
                  className="w-3/4 pr-2"
                />
              </div>
              <div className="absolute flex justify-between p-2 text-white bg-opacity-40 rounded-xl bottom-2 left-2 right-2">
                <button className="px-3 py-1 text-sm text-white bg-green-500 bg-opacity-50 rounded-xl">
                  <h1 className="font-bold">"The Nature Around"</h1>
                  <p className="text-xs">Read story by Ben</p>
                </button>
              </div>
            </div>
            <div className="relative block w-full">
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/666736bb985227e500c29d58_a%20boy%20and%20his%20dog.jpg"
                className="w-full h-auto mx-auto rounded-3xl brightness-75"
              />
              <div className="absolute p-2 bg-green-500 bg-opacity-50 top-2 right-2 rounded-xl">
                <img
                  src="https://d7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io/f1715738840854x400331439026175800/story.svg"
                  alt="Story icon"
                  className="w-3/4 pr-2"
                />
              </div>
              <div className="absolute flex justify-between p-2 text-white bg-opacity-40 rounded-xl bottom-2 left-2 right-2">
                <button className="px-3 py-1 text-sm text-white bg-green-500 bg-opacity-50 rounded-xl">
                  <h1 className="font-bold">"The Nature Around"</h1>
                  <p className="text-xs">Read story by Ben</p>
                </button>
              </div>
            </div>
            <div className="relative block w-full">
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/666736bb985227e500c29d58_a%20boy%20and%20his%20dog.jpg"
                className="w-full h-auto mx-auto rounded-3xl brightness-75"
              />
              <div className="absolute p-2 bg-green-500 bg-opacity-50 top-2 right-2 rounded-xl">
                <img
                  src="https://d7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io/f1715738840854x400331439026175800/story.svg"
                  alt="Story icon"
                  className="w-3/4 pr-2"
                />
              </div>
              <div className="absolute flex justify-between p-2 text-white bg-opacity-40 rounded-xl bottom-2 left-2 right-2">
                <button className="px-3 py-1 text-sm text-white bg-green-500 bg-opacity-50 rounded-xl">
                  <h1 className="font-bold">"The Nature Around"</h1>
                  <p className="text-xs">Read story by Ben</p>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-gray-100">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            {/* <img
              src="path/to/your/image.png"
              alt="Storybook Logo"
              className="w-12 h-12"
            /> */}
            <span className="text-gray-600">Copyright ©2024 Loreloom</span>
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center p-2 space-x-4 rounded-full bg-blue-50">
              <a href="#" className="text-gray-600 hover:underline">
                Terms of Service
              </a>
              <span className="text-gray-300">|</span>
              <a href="#" className="text-gray-600 hover:underline">
                Disclaimer
              </a>
            </div>
          </div>
        </div>
      </footer>
      <div className="fixed flex items-center p-2 space-x-2 bg-white rounded-full shadow-lg bottom-4 right-4 mb-9">
        <span className="font-medium text-gray-700">Need help?</span>
        <button className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.5 18a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 .5.5v12.5a.5.5 0 0 1-.5.5H2.5zM5.5 16.5V5h8v11.5H5.5zM15.5 16V7h-2v9h2.5a.5.5 0 0 1 0 1H15.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Login;
