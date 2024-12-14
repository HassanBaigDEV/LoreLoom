import apiClient from "@/lib/axios";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export const userService = {
  getProfile: async () => {
    const response = await apiClient.get("/user/me");
    localStorage.setItem("user", JSON.stringify(response.data));
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await apiClient.put("/user/me", userData);
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...currentUser, ...response.data };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return response.data;
  },

  deleteAccount: async () => {
    const response = await apiClient.delete("/user/me");
    return response.data;
  },

  uploadProfilePhoto: async (photoFile) => {
    // Validate file size
    if (photoFile.size > MAX_FILE_SIZE) {
      throw new Error("File size too large. Maximum size is 5MB");
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(photoFile.type)) {
      throw new Error("Only JPEG and PNG files are allowed");
    }

    const formData = new FormData();
    formData.append("photo", photoFile);

    const response = await apiClient.post("/user/me/photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...currentUser, photo: response.data.photo };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return response.data;
  },

  removeProfilePhoto: async () => {
    const response = await apiClient.delete("/user/me/photo");

    // Update localStorage to remove photo
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...currentUser, photo: null };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return response.data;
  },

  getUserByUsername: async (username) => {
    const response = await apiClient.get(`/user/users/${username}`);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await apiClient.post('/auth/change-password', passwordData);
    return response.data;
  },
};
