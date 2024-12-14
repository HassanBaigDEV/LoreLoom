"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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

export default function ProtectedRoute({ children }) {
  const { user, checkAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const accessToken = Cookies.get("client_accessToken");

    if (!accessToken) {
      router.push("/login");
      return;
    }

    if (!user) {
      checkAuth().then((userData) => {
        if (!userData) {
          router.push("/login");
        }
        setIsChecking(false);
      });
    } else {
      setIsChecking(false);
    }
  }, [user]);

  if (isChecking) {
    return <LoadingSpinner />;
  }

  return children;
}
