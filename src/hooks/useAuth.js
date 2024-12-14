import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import Cookies from 'js-cookie';

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const router = useRouter();

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem("user");
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      Cookies.remove("client_accessToken");
      Cookies.remove("client_refreshToken");
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuth = async () => {
    try {
      // Check if we already have user data
      if (user) return user;

      // Check if we have tokens
      const accessToken = Cookies.get('client_accessToken');
      if (!accessToken) {
        throw new Error('No access token');
      }

      const response = await apiClient.get('user/me');
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear everything on auth error
      setUser(null);
      localStorage.removeItem("user");
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      Cookies.remove("client_accessToken");
      Cookies.remove("client_refreshToken");
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