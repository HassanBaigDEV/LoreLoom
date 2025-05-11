"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BookOpen, Plus, Filter, Search, ChevronDown } from "lucide-react";
import StoriesGrid from "@/components/dashboard/stories";
import { useStories } from "@/hooks/useStories";

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-opacity-75 bg-gray-50">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
      <div className="mt-4 font-medium text-center text-gray-600">
        Loading...
      </div>
    </div>
  </div>
);

const genres = [
  "All Genres",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Thriller",
  "Adventure",
  "Historical Fiction",
  "Other",
];

function StoriesContent() {
  const { isLoading: authLoading } = useAuth();
  const [user, setUser, storageLoading] = useLocalStorage("user");
  const router = useRouter();
  const { stories, collabStories } = useStories();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  if (authLoading || storageLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleCreateNewStory = () => {
    router.push("/create");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setShowGenreDropdown(false);
  };

  const filterParams = {
    searchTerm,
    selectedGenre: selectedGenre === "All Genres" ? null : selectedGenre,
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-green-500" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold text-gray-900">My Stories</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    {selectedGenre}
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                </button>

                {showGenreDropdown && (
                  <div className="absolute right-0 z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="py-1">
                      {genres.map((genre) => (
                        <button
                          key={genre}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-100 ${
                            genre === selectedGenre
                              ? "bg-green-100 font-medium"
                              : ""
                          }`}
                          onClick={() => handleGenreSelect(genre)}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateNewStory}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-green-500 border border-transparent rounded-lg shadow-sm transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Story
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <StoriesGrid hideHeader filterParams={filterParams} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <ProtectedRoute>
      <StoriesContent />
    </ProtectedRoute>
  );
}
