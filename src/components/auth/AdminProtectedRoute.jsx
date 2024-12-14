"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Cookies from "js-cookie";

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

export default function AdminProtectedRoute({ children }) {
  const { admin, checkAuth } = useAdminAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check for admin token first
        const adminToken = Cookies.get('client_admin_accessToken');
        if (!adminToken) {
          if (!window.location.pathname.includes('/admin/login')) {
            router.push('/admin/login');
          }
          return;
        }

        // Verify admin status
        const adminData = await checkAuth();
        if (!adminData || adminData.role !== 'admin') {
          if (!window.location.pathname.includes('/admin/login')) {
            router.push('/admin/login');
          }
          return;
        }
      } catch (error) {
        console.error('Admin auth verification error:', error);
        if (!window.location.pathname.includes('/admin/login')) {
          router.push('/admin/login');
        }
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [checkAuth, router]);

  // Show loading state while checking
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authenticated as admin
  if (!admin || admin.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
} 