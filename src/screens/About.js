import React from "react";
import "./index.css"; 
import Header from '../Components/header';

function About() {
  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <Header/>
      <section className="flex justify-center flex-grow">
        <div className="text-center text-gray-800">
          <h1 className="mt-20 text-5xl font-bold">
            Crafting Your Story <br /> with Storybook
          </h1>
          <p className="font-bold mt-5 text-black font-['Arial', sans-serif] text-lg">
            Are you ready to unleash your creativity and craft your own <br />
            incredible story? With Storybook, it's easier than ever to <br />
            bring your ideas to life and share them with the world.
          </p>
          <img
            src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/641136bc6a7d952cde9efd34_Plot%20screen.png"
            className="relative w-3/5 h-auto mx-auto"
            alt="Plot screen"
          />
          <div className="text-center text-gray-800 ">
            <h1 className="text-3xl font-bold">
              Follow These Simple Steps to <br /> Create Your Own Unique Tale
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-20 pr-20 mt-8 mb-8">
            <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
              <p className="text-lg text-gray-600">
                Select the type of story you want to create. Whether you want a
                comic book format or a children's storybook, we've got you
                covered.
              </p>
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/64113bcae6edb188d824a4bc_select%20story%20dropdown.png"
                className="relative w-4/6 h-auto mx-auto"
                alt="select type of story"
              />
            </div>
            <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
              <p className="text-gray-600">
                Choose the age range for your story. This will help the AI
                tailor the writing style, genre, and language to ensure your
                story is appropriate for your target audience.
              </p>
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/64113d2f7ebe605b9d34d429_age%20range%20dropdown.png"
                className="relative w-4/6 h-auto mx-auto"
                alt="age range"
              />
            </div>
            <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
              <p className="text-lg text-gray-600">
                Enter the title of your story. This is your chance to grab your
                reader's attention, so choose something that's catchy and
                memorable.
              </p>
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/64113f9d8fed60ebc89e7652_title%20bar.png"
                className="relative w-4/6 h-auto mx-auto mt-5"
                alt="select type of story"
              />
            </div>
            <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
              <p className="text-gray-600">
                Provide a detailed plot summary. This is where you get to let
                your imagination run wild and bring your story to life. Be as
                descriptive as possible, and don't be afraid to add twists and
                turns to keep your readers on the edge of their seats.
              </p>

              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/64113f9dc9faa5d41c9609a8_plot%20bar.png"
                className="relative w-4/6 h-auto mx-auto"
                alt="age range"
              />
            </div>
          </div>
        </div>
      </section>
      <footer className="bg-white">
        <div className="flex justify-center flex-grow bg-white">
          <div className="flex flex-col items-center pt-5 text-center text-gray-800 mt-11">
            <h1 className="text-5xl font-bold">Unleash your creativity</h1>
            <p className="text-lg font-['Arial', sans-serif] p-8 max-w-3xl">
              With these simple steps, you'll be well on your way to creating a
              unique and captivating story that will keep your readers engaged
              from beginning to end. So why wait? Start crafting your own tale
              today with Storybook.
            </p>
            <div className="flex flex-col items-center p-10 space-y-2">
              <a
                href="#"
                className="text-sm hover:underline bg-gray-800 text-white py-3 px-5 rounded font-['Arial', sans-serif]"
              >
                GET STARTED
              </a>
            </div>
          </div>
        </div>
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
            <div className="p-2 ml-4 rounded-full bg-blue-50">
              <a href="#">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-gray-800"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.5 18a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 .5.5v12.5a.5.5 0 0 1-.5.5H2.5zM5.5 16.5V5h8v11.5H5.5zM15.5 16V7h-2v9h2.5a.5.5 0 0 1 0 1H15.5z" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;
