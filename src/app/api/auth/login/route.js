import { cookies } from "next/headers";
import { serialize } from "cookie";
import { NextResponse } from "next/server";

const MAX_AGE = 60 * 60 * 24 * 30; // 24 hours

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;
  const api_uri = process.env.API_URI;
  const uri = `${api_uri}/auth/login`;

  const res = await fetch(uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: email,
      password: password,
    }),
  });
  const user = await res.json();
  const { accessToken, refreshToken } = user;

  // if (res.ok) {
  //   const user = await res.json();
  //   cookies().set("accessToken", user.accessToken, {
  //     httpOnly: true,
  //     maxAge: 24 * 60 * 60,
  //     sameSite: "strict",
  //     path: "/",
  //   });
  //   cookies().set("refreshToken", user.refreshToken, {
  //     httpOnly: true,
  //     maxAge: 24 * 60 * 60 * 30,
  //     sameSite: "strict",
  //     path: "/",
  //   });

  //   return NextResponse.json(user, { status: 201 });
  // } else {
  //   console.error("Login failed", res);
  //   return NextResponse.json({ error: "Login failed" }, { status: 400 });
  // }

  const accessTokenCookie = serialize("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });

  const refreshTokenCookie = serialize("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });

  // Combine the cookies into a single string
  const headers = new Headers();
  headers.append("Set-Cookie", accessTokenCookie);
  headers.append("Set-Cookie", refreshTokenCookie);
  const response = {
    message: "Authenticated!",
    accessToken,
    refreshToken,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers
  });
}
