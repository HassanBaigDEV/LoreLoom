import axios from "axios";
import Cookies from "js-cookie";

const isServer = typeof window === "undefined";

// Function to get the token
export const getToken = async (name) => {
  if (isServer) {
    // On the server side, use next/headers
    try {
      const { cookies } = await import("next/headers");
      const token = cookies().get(name)?.value;
      return token || null;
    } catch (error) {
      console.log("Error getting token on server:", error);
      return null;
    }
  } else {
    // On the client side, use js-cookie with the client_ prefix
    return Cookies.get(`client_${name}`);
  }
};

// Create the Axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URI || "http://localhost:8081",
  withCredentials: true, // Important for sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = !isServer
      ? Cookies.get("client_accessToken")
      : await getToken("accessToken");

    console.log("Token:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = !isServer
          ? Cookies.get("client_refreshToken")
          : await getToken("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URI}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (!isServer) {
          Cookies.set("client_accessToken", accessToken);
          Cookies.set("client_refreshToken", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        if (!isServer) {
          Cookies.remove("client_accessToken");
          Cookies.remove("client_refreshToken");
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// import axios from "axios";

// const isServer = typeof window === "undefined";

// // Function to get the token
// export const getToken = async (name) => {
//   if (isServer) {
//     // On the server side, use next/headers (for app directory) or cookies-next (for pages directory)
//     try {
//       const { cookies } = await import("next/headers");
//       const token = cookies().get(name)?.value; // For app directory (server components)
//       return token || null;
//     } catch (error) {
//       // Fallback for pages directory using cookies-next
//       // return getCookie(name);
//       console.log("Error getting token:", error);
//     }
//   } else {
//     const { getCookie } = await import("cookies-next"); // On the client side, use cookies-next
//     return getCookie(name);
//   }
// };

// // Create the Axios instance
// const apiClient = axios.create({
//   baseURL: "http://localhost:8081", // Your API base URL
//   withCredentials: true, // Ensure cookies are sent with requests
// });

// // Add a request interceptor to include the Authorization header
// apiClient.interceptors.request.use(
//   async (config) => {
//     const token = await getToken("accessToken");
//     console.log("Token:", token);
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     console.error("Request error", error);
//     const originalRequest = error.config;
//     if (error?.response?.status === 401 && !originalRequest?._retry) {
//       originalRequest._retry = true;
//       try {
//         const refreshToken = await getToken("refreshToken");
//         const response = await axios.post(
//           "http://localhost:8081/auth/refresh",
//           {
//             refreshToken,
//           }
//         );

//         // Update tokens
//         Cookies.set("accessToken", response?.data.accessToken);
//         Cookies.set("refreshToken", response?.data.refreshToken);

//         // Set the new access token in the original request
//         originalRequest.headers[
//           "Authorization"
//         ] = `Bearer ${response.data.accessToken}`;

//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         console.error("Token refresh failed", refreshError);
//         // Handle logout or redirect to login page
//         // Example: window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default apiClient;
