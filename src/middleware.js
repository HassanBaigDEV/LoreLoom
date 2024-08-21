import { NextResponse } from "next/server";
import { getToken } from "@/lib/axios";

// This function can be marked `async` if using `await` inside
export async function middleware(request) {
  // check if the user is authenticated
  const accessToken = await getToken("accessToken");
  if (!accessToken) {
    // return NextResponse.redirect(new URL("/login", request.url)); // commented for development
  }
  // return NextResponse.redirect(new URL("/dashboard", request.url));
}

// See "Matching Paths" below to learn more
export const config = {
  // matcher: "/dashboard",
};
