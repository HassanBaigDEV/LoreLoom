import { useAtom } from 'jotai';
import { adminAtom } from '@/store/atoms';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import adminApiClient from '@/lib/adminApiClient';

const isServer = typeof window === "undefined";

export function useAdminAuth() {
  const [admin, setAdmin] = useAtom(adminAtom);
  const router = useRouter();

  useEffect(() => {
    // Try to initialize admin state from localStorage
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setAdmin(adminData);
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        localStorage.removeItem('admin');
      }
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we already have admin data
      if (admin) return admin;

      // Check if we have admin tokens
      const accessToken = Cookies.get('client_admin_accessToken');
      
      if (!accessToken) {
        throw new Error('No admin access token');
      }

      // Get admin data
      const response = await adminApiClient.get('admin/dashboard');
      const adminData = { 
        ...response.data, 
        role: 'admin',
      };
      
      setAdmin(adminData);
      localStorage.setItem("admin", JSON.stringify(adminData));

      return adminData;
    } catch (error) {
      console.error('Admin auth check error:', error);
      // Only clear admin data
      clearAdminAuth();
      return null;
    }
  };

  const logout = async () => {
    try {
      clearAdminAuth();
      router.push('/admin/login');
    } catch (error) {
      console.error('Admin logout error:', error);
    }
  };

  // Add a helper function to clear admin auth
  const clearAdminAuth = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
    
    // Only remove admin-related cookies
    const cookiesToRemove = [
      'client_admin_accessToken',
      'client_admin_refreshToken',
      'admin_accessToken',
      'admin_refreshToken'
    ];
    
    cookiesToRemove.forEach(name => {
      Cookies.remove(name, { path: '/' });
    });

    // Don't remove user cookies or redirect to user login
  };

  return {
    admin,
    setAdmin,
    logout,
    checkAuth,
    isAuthenticated: !!admin,
  };
} 