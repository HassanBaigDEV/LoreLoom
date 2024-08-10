import React from "react";
import Header from "../../components/common/header/header3";

export default function page() {
  return (
    <div className="bg-gray-100 App">
      <Header />
      <main className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-6 gap-6 mt-32">
            <div className="col-span-2 row-span-2 overflow-hidden bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Hey muzzz!
                </h3>
                <p className="max-w-2xl mt-1 text-sm text-gray-500">
                  Stories left for today - 3/3
                </p>
                <div className="flex mt-5 space-x-3">
                  <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Create a story
                  </button>
                  <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-gray-200 border border-transparent rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Generate an image
                  </button>
                </div>
                <div className="relative w-auto mt-5">
                  <img
                    className="object-cover w-full rounded-lg brightness-75"
                    src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1714076964381x992825504655513900%2FPlus.jpg?w=512&h=196&auto=compress&fit=crop&dpr=0.75&_gl=1*tblpto*_gcl_au*Nzk4ODE0OTgzLjE3MDk2MTU0MjI.*_ga*MTk1MjI2OTgxNC4xNjkzMjg1NTky*_ga_BFPVR2DEE2*MTcxNTcwMDc4Ni44OC4xLjE3MTU3MTc1OTguNTkuMC4w"
                    alt="Promotion Image"
                  />
                  <div className="absolute text-white bottom-4 left-4">
                    <p className="text-sm">Upgrade Unlimited Stories & more</p>
                    <p className="font-bold">Only $14/month</p>{" "}
                  </div>
                  <button className="absolute inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-500 bg-opacity-50 border border-transparent rounded-md shadow-sm bottom-4 right-4 hover:bg-blue-900 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Upgrade
                  </button>
                </div>
              </div>
            </div>
            <div className="col-span-4 overflow-hidden bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Your Statistics
                </h3>
                <div className="flex justify-between mt-5">
                  <div className="flex items-center text-center">
                    <img
                      src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1716875612705x568042249043008200%2FSTBK-token.png?w=96&h=79&auto=compress&dpr=0.75&fit=max"
                      alt="Token icon"
                      className="w-2/4 pr-2"
                    />
                    <div>
                      <div className="text-4xl font-semibold text-yellow-500">
                        0
                      </div>
                      <div className="text-sm text-gray-500">Tokens</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <img
                      src="https://d7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io/f1715738840854x400331439026175800/story.svg"
                      alt="Story icon"
                      className="w-3/4 pr-2"
                    />
                    <div>
                      <div className="text-4xl font-semibold text-green-500">
                        2
                      </div>
                      <div className="text-sm text-gray-500">Stories</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-semibold text-gray-900">
                      0
                    </div>
                    <div className="text-sm text-gray-500">Digital Comics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-semibold text-gray-900">
                      0
                    </div>
                    <div className="text-sm text-gray-500">Story Audio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-semibold text-gray-900">
                      0
                    </div>
                    <div className="text-sm text-gray-500">
                      Image Generations
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-2 overflow-hidden bg-white rounded-lg shadow">
              <div className="flex items-center justify-between px-4 py-5 sm:p-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Leave Feedback
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Let us know how your StoryBook experience has been.
                    <a href="#" className="text-blue-600 hover:text-blue-800">
                      Learn More
                    </a>
                  </p>
                </div>
                <img
                  src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1716340871093x646031830035817900%2Ffeedback-icon.png?w=128&h=128&auto=compress&dpr=0.75&fit=max"
                  alt="Feedback icon "
                  className="w-3/6"
                />
              </div>
            </div>
            <div className="col-span-2 overflow-hidden bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Notifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Due to the impact of Hurricane Beryl on Jamaica, where our
                  support team is located, there may be interruptions or delays
                  in real-time support chats and email responses. We apologize
                  for any inconvenience this may cause. You can still send your
                  queries and...
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  View All
                </a>
              </div>
            </div>
          </div>
          <hr className="mt-20 mb-10 border-t border-gray-300" />

          <div className="mt-8">
            <div className="flex items-center text-lg font-medium leading-6 text-gray-900">
              <img
                src="https://d7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io/f1715738840854x400331439026175800/story.svg"
                alt="Story icon"
                className="w-6 h-6 mr-2"
              />
              Stories
            </div>
            <div className="flex mt-4 space-x-4">
              <div className="flex flex-col items-center justify-center w-64 h-64 bg-gray-200 rounded-lg">
                <div className="w-16 h-16 bg-green-400 rounded-full"></div>
                <div className="mt-2 font-semibold">Lord of Mysteries</div>
                <div className="text-sm text-gray-500">Mystery</div>
              </div>
              <div className="flex flex-col items-center justify-center w-64 h-64 bg-gray-200 rounded-lg">
                <div className="w-16 h-16 bg-green-400 rounded-full"></div>
                <div className="mt-2 font-semibold">Reverend Insanity</div>
                <div className="text-sm text-gray-500">Mystery</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed flex items-center p-2 space-x-2 bg-white rounded-full shadow-lg bottom-4 right-4 mb-9">
        <span className="font-medium text-gray-700">Need help?</span>
        <button className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.5 18a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 .5.5v12.5a.5.5 0 0 1-.5.5H2.5zM5.5 16.5V5h8v11.5H5.5zM15.5 16V7h-2v9h2.5a.5.5 0 0 1 0 1H15.5z" />
          </svg>
        </button>
      </div>
      <footer className="bg-gray-100">
        <div className="flex items-center justify-between p-4 mt-11">
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
    </div>
  );
}
