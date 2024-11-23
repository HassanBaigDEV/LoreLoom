import { cookies } from "next/headers";
import { serialize } from "cookie";
import { NextResponse } from "next/server";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const api_uri = process.env.API_URI || 'http://localhost:8081';
    const uri = `${api_uri}/auth/login`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
      signal: controller.signal,
      credentials: 'include',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { message: errorData.message || "Authentication failed" },
        { status: res.status }
      );
    }

    const user = await res.json();
    const { accessToken, refreshToken } = user;

    // Create httpOnly cookies for security
    const secureAccessTokenCookie = serialize("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    const secureRefreshTokenCookie = serialize("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    // Create non-httpOnly cookies for client-side access
    const clientAccessTokenCookie = serialize("client_accessToken", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    const clientRefreshTokenCookie = serialize("client_refreshToken", refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    // Create response with cookies
    const response = NextResponse.json(
      {
        message: "Authenticated!",
        user: user,
        accessToken,
        refreshToken,
      },
      { status: 200 }
    );

    // Append all cookies to response
    response.headers.append("Set-Cookie", secureAccessTokenCookie);
    response.headers.append("Set-Cookie", secureRefreshTokenCookie);
    response.headers.append("Set-Cookie", clientAccessTokenCookie);
    response.headers.append("Set-Cookie", clientRefreshTokenCookie);

    return response;

  } catch (error) {
    console.error("Login error:", error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { message: "Request timeout - please try again" },
        { status: 408 }
      );
    }

    if (!error.response) {
      return NextResponse.json(
        { message: "Network error - please check your connection" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
