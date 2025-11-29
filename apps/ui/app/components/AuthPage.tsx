"use client";
import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";

// const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://canvas-be-m6vl.onrender.com";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

console.log("Using BACKEND URL:", BACKEND);
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
        console.log("Signup response data:", data);

        // Store token if provided by signup endpoint
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // Store first name for header display
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
      console.log("Signin response data:", data);

      if (data.token) {
        localStorage.setItem("token", data.token);


        // fetch userinfo to get canonical name and store first name only
        try {
          const userRes = await axios.get(`${BACKEND}/userinfo`, {
            headers: { Authorization: data.token },
          });
          const fullName: string = userRes.data?.user?.name || "";
          const firstName = fullName ? fullName.split(" ")[0] : email.split("@")[0];
          localStorage.setItem("name", toCapitalized(firstName));
        } 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        catch (e) {
          // fallback to email prefix if userinfo fails
          const fallback = toCapitalized(email.split("@")[0].split(".")[0]);
          localStorage.setItem("name", fallback);
        }

        alert("Sign-in successful");
        window.location.href = "/";
        return;
      }

      alert(res.data?.message || "Authentication failed");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err?.response?.data?.message || err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#111a33] to-[#050915] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#3C82F6] via-[#8B5CF6] to-[#F472B6] rounded-2xl blur opacity-75"></div>
          
          {/* Card */}
          <div className="relative bg-[#0C1326]/95 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-white mb-2">
                {isSignin ? "Welcome back" : "Join Sketchy"}
              </h1>
              <p className="text-slate-400 text-sm">
                {isSignin 
                  ? "Sign in to continue drawing with your team" 
                  : "Create your account and start sketching together"
                }
              </p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-[#5BA8FF]/40 focus:ring-2 focus:ring-[#5BA8FF]/20 focus:outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-[#5BA8FF]/40 focus:ring-2 focus:ring-[#5BA8FF]/20 focus:outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#3C82F6] to-[#8B5CF6] text-white font-medium rounded-xl shadow-[0_20px_40px_-24px_rgba(60,130,246,0.7)] hover:opacity-90 focus:ring-2 focus:ring-[#5BA8FF]/50 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {isSignin 
                  ? (loading ? "Signing in..." : "Sign in") 
                  : (loading ? "Creating account..." : "Create account")
                }
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                {isSignin ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-[#5BA8FF] hover:text-[#9dc4ff] transition-colors font-medium">
                      Sign up
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link href="/signin" className="text-[#5BA8FF] hover:text-[#9dc4ff] transition-colors font-medium">
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}