import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import Cookies from "js-cookie";

const isServer = typeof window === "undefined";

const removeCookie = (name) => {
  // List of possible cookie configurations
  const cookieConfigs = [
    {}, // default
    { path: "/" },
    { path: "", domain: "" },
    { path: "/", domain: window.location.hostname },
    { path: "/", domain: `.${window.location.hostname}` },
  ];

  // Try removing cookie with each configuration
  cookieConfigs.forEach((config) => {
    Cookies.remove(name, config);
  });
};

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const router = useRouter();

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem("user");

      // List of all possible token names
      const tokenKeys = [
        "accessToken",
        "refreshToken",
        "client_accessToken",
        "client_refreshToken",
      ];

      if (isServer) {
        const { cookies } = await import("next/headers");
        tokenKeys.forEach((key) => {
          cookies().delete(key);
        });
      } else {
        // Remove each token with all possible configurations
        tokenKeys.forEach(removeCookie);
      }

      // Clear any other auth-related data
      localStorage.clear();
      sessionStorage.clear();

      // Optional: Make a logout request to the backend
      try {
        // await apiClient.post('/auth/logout');
      } catch (error) {
        console.error("Backend logout failed:", error);
      }

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const checkAuth = async () => {
    try {
      // Check if we already have user data
      if (user) return user;

      // Check if we have tokens
      const accessToken = Cookies.get("client_accessToken");
      if (!accessToken) {
        throw new Error("No access token");
      }

      const response = await apiClient.get("user/me");
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Auth check error:", error);
      // Clear everything on auth error
      setUser(null);
      localStorage.removeItem("user");
      tokenKeys?.forEach(removeCookie);
      return null;
    }
  };

  return {
    user,
    setUser,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };
}
