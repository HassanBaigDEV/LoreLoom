"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const response = await fetch("/api/me");
      const data = await response.json();
      console.log("Response:", data.accessToken);
      if (response.status === 401) {
        router.push("/login");
      } else console.log("User is authenticated");
    })();
  }, [router]);

  return <main>{children}</main>;
}
