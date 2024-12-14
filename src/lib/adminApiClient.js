import axios from "axios";
import Cookies from "js-cookie";

const isServer = typeof window === "undefined";

// Function to get admin token
export const getAdminToken = async (name) => {
  if (isServer) {
    try {
      const { cookies } = await import("next/headers");
      const token = cookies().get(name)?.value;
      return token || null;
    } catch (error) {
      console.log("Error getting admin token on server:", error);
      return null;
    }
  } else {
    return Cookies.get(`client_${name}`);
  }
};

// Create the Admin Axios instance
const adminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URI || "http://localhost:8081",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for admin routes
adminApiClient.interceptors.request.use(
  async (config) => {
    const token = !isServer
      ? Cookies.get("client_admin_accessToken")
      : await getAdminToken("admin_accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["X-Admin-Request"] = "true";
    } else {
      // If no token, redirect to admin login
      if (!isServer && !window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    console.log("Admin API Client Token:", token);
    console.log("Request Headers:", config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling admin token refresh
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = !isServer
          ? Cookies.get("client_admin_refreshToken")
          : await getAdminToken("admin_refreshToken");

        if (!refreshToken) {
          throw new Error("No admin refresh token available");
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URI}/admin/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (!isServer) {
          Cookies.set("client_admin_accessToken", accessToken, { path: "/" });
          Cookies.set("client_admin_refreshToken", newRefreshToken, {
            path: "/",
          });
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return adminApiClient(originalRequest);
      } catch (refreshError) {
        console.error("Admin token refresh failed:", refreshError);

        if (!isServer) {
          // Clear only admin cookies
          Cookies.remove("client_admin_accessToken", { path: "/" });
          Cookies.remove("client_admin_refreshToken", { path: "/" });
          Cookies.remove("admin_accessToken", { path: "/" });
          Cookies.remove("admin_refreshToken", { path: "/" });

          // Redirect to admin login instead of user login
          if (!window.location.pathname.includes("/admin/login")) {
            window.location.href = "/admin/login";
          }
        }

        return Promise.reject(refreshError);
      }
    }

    // For other errors, redirect to admin login if it's an auth error
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      if (!isServer && !window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

export default adminApiClient;
