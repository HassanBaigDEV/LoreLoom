import Footer from "@/components/home/footer";
import apiClient from "@/lib/axios";
import Link from "next/link";

export default async function page() {
  try {
    // const response = await apiClient.get("/protected-route");
    // console.log("Protected route response", response);
  } catch (error) {
    // console.log("Protected route error", error);
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="flex items-center justify-between bg-white border-b border-gray-300 rounded-b-lg p-7">
          <div className="flex-1 pl-32">
            <h1 className="text-2xl font-bold text-gray-700">StoryWeaver</h1>
          </div>
          <nav className="flex items-center pr-32 space-x-4">
            <a href="#" className="text-sm text-gray-700 hover:underline">
              Feature
            </a>
            <a href="#" className="text-sm text-gray-700 hover:underline">
              Pricing
            </a>
            <a href="/about" className="text-sm text-gray-700 hover:underline">
              How it works
            </a>
            <div className="flex items-center space-x-2">
              <div className="w-0.5 h-6 bg-gray-300"></div>
              <Link
                href="/login"
                className="text-sm hover:underline bg-gray-800 text-white py-3 px-5 rounded font-['Arial', sans-serif]"
              >
                GET STARTED FOR FREE
              </Link>
            </div>
          </nav>
        </header>
        <div className="relative w-auto">
          <img
            src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/66679bbe15a67ea0900d17ec_seilala-cover.jpg"
            alt="Login"
            className="object-cover w-full h-full brightness-75"
          />
          <div className="absolute p-3 mx-auto text-center text-white bg-opacity-40 rounded-xl bottom-4 left-4 right-4">
            <h1 className="font-bold text-7xl">"A New Era of Storytelling"</h1>
            <button className="px-4 py-2 mt-4 text-white bg-green-500 bg-opacity-50 rounded-2xl">
              "The Curly Crown"
              <br />
              Read story by Kevin
            </button>
          </div>
        </div>
        <div className="text-center text-gray-700">
          <h1 className="mt-20 text-6xl font-bold">
            Welcome to <br /> StoryWeaver
          </h1>
          <p className="font-bold mt-5 text-gray-500 text font-['Arial', sans-serif] text-lg">
            Our AI-powered story generator, that <br /> can take that spark and
            turn it into an incredible tale in just one <br /> minute.
          </p>
          <img
            src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/66632dac06b098da52cc0dda_Dashboard%20v2.png"
            className="relative w-3/6 h-auto mx-auto"
          />
          <div className="grid w-3/5 grid-cols-2 gap-4 pl-20 pr-20 mx-auto mt-8">
            <div className="relative w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
              <h1 className="text-2xl font-bold leading-tight text-amber-500">
                Generate stories within 60 seconds
              </h1>
              <p className="pt-5 text-xl text-gray-600">
                Our AI story generator is lightning-fast, allowing you to create
                unique and engaging stories in seconds. Whether you're looking
                to craft a captivating tale to share with friends or want to
                develop your storytelling skills, our intuitive tools make it
                easy to create stories that are as compelling as they are
                entertaining.
              </p>
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/63fbf17f7685319053374539_lightning.svg"
                className="absolute w-1/6 h-auto bottom-5 right-6"
              />
            </div>
            <div className="w-5/6 h-auto max-w-xl p-6 mx-auto bg-white shadow-lg min-h-10 rounded-3xl">
              <h1 className="text-2xl font-bold leading-tight text-blue-500">
                Discover
              </h1>
              <p className="pt-5 text-xl text-gray-600">
                Looking for inspiration or just want to see what others are
                creating? Our platform allows you to browse and read stories
                from other users, giving you access to a wealth of incredible
                tales and creative ideas.
              </p>
              <div className="relative flex justify-center w-full h-auto mx-auto mt-5">
                <img
                  src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/66672715d393512715152fe5_girl%20in%20spaceship-p-800.jpg"
                  className="absolute z-20 w-3/6 h-auto rounded-3xl left-2/4"
                />
                <img
                  src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/66672c7b43edf2b2bb5c99b4_girl-hiding-in-bushes.jpg"
                  className="absolute z-30 w-3/6 h-auto rounded-3xl left-1/4"
                />
                <img
                  src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/66672c7bb952a3f649cf77bd_mother-and-son-flying-p-500.jpg"
                  className="absolute left-0 z-10 w-3/6 h-auto rounded-3xl"
                />
              </div>
            </div>
          </div>
          <img
            src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/654073c5bae0ba48124c494e_Audio-wave%20v2%20copy.png"
            className="relative w-full h-auto mx-auto"
          />
        </div>
        <div className="text-center text-gray-700">
          <p className="font-bold mt-5 text-gray-500 text font-['Arial', sans-serif] text-lg">
            Pricing
          </p>
          <h1 className="mt-5 text-5xl font-bold text-green-500 opacity-75">
            Affordable Pricing for Endless <br /> Storytelling Possibilities
          </h1>
        </div>
        <section className="flex items-center justify-center min-h-screen">
          <div className="flex flex-row space-x-4 pt-s4">
            {/* Basic Card */}
            <div className="p-8 pr-16 text-center bg-white shadow-xl w-96 rounded-3xl">
              <h1 className="text-2xl font-semibold text-gray-700">Basic</h1>
              <p className="pt-2 tracking-wide">
                <span className="text-gray-400 align-top">$ </span>
                <span className="text-3xl font-semibold">10</span>
                <span className="font-medium text-gray-400">/ user</span>
              </p>
              <hr className="mt-4 border-1" />
              <div className="pt-8">
                <p className="font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    Get started with{" "}
                    <span className="text-gray-700">messaging</span>
                  </span>
                </p>
                <p className="pt-5 font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    Flexible{" "}
                    <span className="text-gray-700">team meetings</span>
                  </span>
                </p>
                <p className="pt-5 font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    <span className="text-gray-700">5 TB</span> cloud storage
                  </span>
                </p>
                <a href="#" className="">
                  <p className="w-full py-4 mt-8 border rounded-xl">
                    {" "}
                    <span className="font-medium">Choose Plan</span>
                    <span className="pl-2 text-sm align-middle material-icons">
                      east
                    </span>
                  </p>
                </a>
              </div>
            </div>

            {/* Startup Card */}
            <div className="relative p-8 text-center text-white transform scale-125 bg-green-500 border-4 border-white shadow-xl w-80 rounded-3xl">
              <h1 className="text-2xl font-semibold text-white">Startup</h1>
              <p className="pt-2 tracking-wide">
                <span className="text-gray-400 align-top">$ </span>
                <span className="text-3xl font-semibold">24</span>
                <span className="font-medium text-gray-400">/ user</span>
              </p>
              <hr className="mt-4 border-gray-600 border-1" />
              <div className="pt-8">
                <p className="font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    All features in <span className="text-white">Basic</span>
                  </span>
                </p>
                <p className="pt-5 font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    Flexible <span className="text-white">call scheduling</span>
                  </span>
                </p>
                <p className="pt-5 font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    <span className="text-white">15 TB</span> cloud storage
                  </span>
                </p>
                <a href="#" className="">
                  <p className="w-full py-4 mt-8 text-white bg-gray-800 rounded-xl">
                    <span className="font-medium">Choose Plan</span>
                    <span className="pl-2 text-sm align-middle material-icons">
                      east
                    </span>
                  </p>
                </a>
              </div>
              <div className="absolute top-4 right-4">
                <p className="px-4 py-1 text-xs font-semibold uppercase bg-gray-800 rounded-full">
                  Popular
                </p>
              </div>
            </div>

            {/* Enterprise Card */}
            <div className="p-8 pl-16 text-center bg-white shadow-xl w-96 rounded-3xl">
              <h1 className="text-2xl font-semibold text-gray-700">
                Enterprise
              </h1>
              <p className="pt-2 tracking-wide">
                <span className="text-gray-400 align-top">$ </span>
                <span className="text-3xl font-semibold">35</span>
                <span className="font-medium text-gray-400">/ user</span>
              </p>
              <hr className="mt-4 border-1" />
              <div className="pt-8">
                <p className="font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    All features in{" "}
                    <span className="text-gray-700">Startup</span>
                  </span>
                </p>
                <p className="pt-5 font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    Growth <span className="text-gray-700">oriented</span>
                  </span>
                </p>
                <p className="pt-5 font-semibold text-left text-gray-400">
                  <span className="align-middle material-icons">done</span>
                  <span className="pl-2">
                    <span className="text-gray-700">Unlimited</span> cloud
                    storage
                  </span>
                </p>
                <a href="#" className="">
                  <p className="w-full py-4 mt-8 border rounded-xl">
                    <span className="font-medium">Choose Plan</span>
                    <span className="pl-2 text-sm align-middle material-icons">
                      east
                    </span>
                  </p>
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="relative block w-4/6 mx-auto">
          <img
            src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/666736bb985227e500c29d58_a%20boy%20and%20his%20dog.jpg"
            className="mx-auto rounded-3xl brightness-75"
          />
          <div className="absolute flex justify-between p-3 text-white bg-opacity-40 rounded-xl bottom-4 left-4 right-4">
            <button className="px-4 py-2 text-white bg-green-500 bg-opacity-50 rounded-2xl">
              <h1 className="font-bold">"The Nature Around"</h1>
              <p>Read story by Ben</p>
            </button>
            <button className="px-4 py-2 text-white bg-green-500 bg-opacity-50 rounded-2xl">
              <img
                src="https://cdn.prod.website-files.com/63f436fc275e8120c6583448/66679d6c8dddd035fdf65454_white%20arrow-link.svg"
                className="w-3"
              />
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
