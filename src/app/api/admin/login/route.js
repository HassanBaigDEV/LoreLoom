import { cookies } from "next/headers";
import { serialize } from "cookie";
import { NextResponse } from "next/server";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const api_uri = process.env.API_URI || "http://localhost:8081";
    const uri = `${api_uri}/admin/login`;

    const res = await fetch(uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
      credentials: "include",
      mode: "cors",
    });

    // Check if the response is JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, log the response for debugging
      const text = await res.text();
      console.error("Non-JSON response:", text);
      return NextResponse.json(
        { message: "Server returned an invalid response format" },
        { status: 500 }
      );
    }

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { message: errorData.detail || "Authentication failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const { access_token, refresh_token } = data;

    // Create cookies with proper configuration
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    };

    // Create admin-specific cookies
    const cookies = [
      serialize("admin_accessToken", access_token, cookieOptions),
      serialize("admin_refreshToken", refresh_token, cookieOptions),
      serialize("client_admin_accessToken", access_token, cookieOptions),
      serialize("client_admin_refreshToken", refresh_token, cookieOptions),
    ];

    const response = NextResponse.json(
      {
        message: "Authenticated!",
        user: data.user,
        access_token,
        refresh_token,
      },
      { status: 200 }
    );

    // Set all cookies
    cookies.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
