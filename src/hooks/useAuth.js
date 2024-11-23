import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const router = useRouter();

  const logout = async () => {
    try {
      // Clear user data
      setUser(null);
      // clear local storage
      localStorage.removeItem("user");
      // clear cookies
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");

      // Call logout endpoint if you have one
      // await apiClient.post('/api/auth/logout');

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await apiClient.get('user/me');
      setUser(response.data);
      // save to local storage
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      setUser(null);
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