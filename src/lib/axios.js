
import axios from "axios";

const isServer = typeof window === "undefined";

// Function to get the token
export const getToken = async (name) => {
  if (isServer) {
    // On the server side, use next/headers (for app directory) or cookies-next (for pages directory)
    try {
      const { cookies } = await import("next/headers");
      const token = cookies().get(name)?.value; // For app directory (server components)
      return token || null;
    } catch (error) {
      // Fallback for pages directory using cookies-next
      // return getCookie(name);
      console.log("Error getting token:", error);
    }
  } else {
    const { getCookie } = await import("cookies-next"); // On the client side, use cookies-next
    return getCookie(name);
  }
};

// Create the Axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:8081", // Your API base URL
  withCredentials: true, // Ensure cookies are sent with requests
});

// Add a request interceptor to include the Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken("accessToken");
    console.log("Token:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("Request error", error);
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getToken("refreshToken");
        const response = await axios.post(
          "http://localhost:8081/auth/refresh",
          {
            refreshToken,
          }
        );

        // Update tokens
        Cookies.set("accessToken", response?.data.accessToken);
        Cookies.set("refreshToken", response?.data.refreshToken);

        // Set the new access token in the original request
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${response.data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed", refreshError);
        // Handle logout or redirect to login page
        // Example: window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


export default apiClient;

// import axios from "axios";
// import { cookies } from "next/headers";

// const apiClient = axios.create({
//   baseURL: "http://localhost:8081", // Your backend URL
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
// console.log("Cookies:", apiClient);
// const COOKIE_NAME = "accessToken";

// apiClient.interceptors.request.use(
//   (config) => {
//     const cookieStore = cookies();

//     const token = cookieStore.get(COOKIE_NAME);
//     const { value } = token;
//     console.log("Token:", value);

//     // const { cookies } = await import("next/headers");
//     // const cookieStore = cookies();

//     // const token = cookieStore.get(COOKIE_NAME);
//     // const { value } = token;
//     // const token = Cookies.get("accessToken");
//     // const token = getCookie("accessToken");
//     // console.log("Token:", token);
//     // if (token) {
//     //   config.headers["Authorization"] = `Bearer ${token}`;
//     // }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // apiClient.interceptors.response.use(
// //   (response) => response,
// //   async (error) => {
// //     console.error("Request error", error);
// //     const originalRequest = error.config;
// //     if (error?.response?.status === 401 && !originalRequest?._retry) {
// //       originalRequest._retry = true;
// //       try {
// //         const refreshToken = Cookies.get("refreshToken");
// //         const response = await axios.post(
// //           "http://localhost:8081/auth/refresh",
// //           {
// //             refreshToken,
// //           }
// //         );

// //         // Update tokens
// //         Cookies.set("accessToken", response?.data.accessToken);
// //         Cookies.set("refreshToken", response?.data.refreshToken);

// //         // Set the new access token in the original request
// //         originalRequest.headers[
// //           "Authorization"
// //         ] = `Bearer ${response.data.accessToken}`;

// //         return apiClient(originalRequest);
// //       } catch (refreshError) {
// //         console.error("Token refresh failed", refreshError);
// //         // Handle logout or redirect to login page
// //         // Example: window.location.href = "/login";
// //       }
// //     }
// //     return Promise.reject(error);
// //   }
// // );

// export default apiClient;
