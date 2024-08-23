import { NextResponse } from "next/server";
import { getToken } from "@/lib/axios";

// This function can be marked `async` if using `await` inside
export async function middleware(request) {
  // check if the user is authenticated
  const accessToken = await getToken("accessToken");
  if (!accessToken) {
    // return NextResponse.redirect(new URL("/login", request.url)); // Redirect to login page if not authenticated
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher:["/dashboard", "/Usettings","/generator"], // Array of strings or regular expressions
};
