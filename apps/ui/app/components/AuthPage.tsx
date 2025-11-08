
"use client";
import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const toCapitalized = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Enter all fields");
      return;
    }
    setLoading(true);

    try {
      if (!isSignin) {
        // Signup: send name (derived from email prefix) + username + password
        const rawName = email.split("@")[0].replace(/\./g, " ");
        const nameToSend = toCapitalized(rawName.split(" ")[0]);
        const res = await axios.post(`${BACKEND}/signup`, {
          username: email,
          password,
          name: nameToSend,
        });

        const data = res.data;
        // backend returns userId on success (no token) — still store first name so header updates
        localStorage.setItem("name", nameToSend);
        alert("Sign-up successful");
        window.location.href = "/";
        return;
      }

      // Signin
      const res = await axios.post(`${BACKEND}/signin`, {
        username: email,
        password,
      });
      const data = res.data;

      if (data.token) {
        localStorage.setItem("token", data.token);

        // fetch userinfo to get canonical name and store first name only
        try {
          const userRes = await axios.get(`${BACKEND}/userinfo`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          const fullName: string = userRes.data?.user?.name || "";
          const firstName = fullName ? fullName.split(" ")[0] : email.split("@")[0];
          localStorage.setItem("name", toCapitalized(firstName));
        } catch (e) {
          // fallback to email prefix if userinfo fails
          const fallback = toCapitalized(email.split("@")[0].split(".")[0]);
          localStorage.setItem("name", fallback);
        }

        alert("Sign-in successful");
        window.location.href = "/";
        return;
      }

      alert(res.data?.message || "Authentication failed");
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-blue-500 mb-4">
          {isSignin ? "Sign In" : "Sign Up"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-72 p-3 text-neutral-400 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-72 p-3 mb-6 border text-neutral-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-72 p-3 bg-black text-white rounded-md hover:bg-gray-800 transition duration-300 disabled:opacity-60"
          onClick={handleAuth}
          disabled={loading}
        >
          {isSignin ? (loading ? "Signing in..." : "Sign In") : loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          {isSignin ? (
            <>
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-500 hover:underline">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/signin" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}