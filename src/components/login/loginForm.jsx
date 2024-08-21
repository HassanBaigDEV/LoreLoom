"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    // const result = await signIn("credentials", {
    //   redirect: false,
    //   email,
    //   password,
    //   // callbackUrl: "/",
    // });
    const payload = {
      email,
      password,
    };
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log("Login response:", response.data);

    if (response.status === 200) {
      const data = await response.json();
      console.log("Login successful:", data);
      router.push("/");
    } else {
      console.error("Sign in failed", await response.json());
    }
  };
  return (
    <form className="w-full max-w-xs" onSubmit={handleSubmit}>
      <label htmlFor="email" className="block mb-1 font-bold text-gray-700">
        Email
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        className="w-full text-black p-2 mb-4 border border-gray-300 rounded"
      />
      <label htmlFor="password" className="block mb-1 font-bold text-gray-700">
        Password
      </label>
      <input
        type="password"
        id="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full text-black p-2 mb-4 border border-gray-300 rounded"
      />
      <a href="#" className="block mb-4 text-sm text-blue-600 hover:underline">
        Forgot your password?
      </a>
      <button
        type="submit"
        className="w-full p-1 mb-4 text-white bg-green-500 rounded"
      >
        Sign In
      </button>
      <p className="text-center text-gray-700">
        Don't have an account?{" "}
        <a className="text-blue-600 hover:underline">Sign Up</a>
      </p>
    </form>
  );
}
