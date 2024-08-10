import React from "react";
import "../index.css"; // Ensure this imports the Tailwind CSS file

class Footer extends React.Component {
  render() {
    return (
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
    );
  }
}

export default Footer;
