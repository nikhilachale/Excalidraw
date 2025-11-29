
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useInfo } from "../hooks/useinfo";

const Header: React.FC = () => {
  const [userInitial, setUserInitial] = useState("");

  const { loading: infoLoading, info } = useInfo();

  // immediate localStorage read for instant UX
  useEffect(() => {
    const name = localStorage.getItem("name");
    if (name) setUserInitial(name.charAt(0).toUpperCase());
  }, []);

  // sync with backend-fetched user info (if available)
  useEffect(() => {
    if (!infoLoading && info?.name) {
      setUserInitial(info.name.charAt(0).toUpperCase());
      // also ensure localStorage is in sync
      localStorage.setItem("name", info.name.split(" ")[0]);
    }
  }, [infoLoading, info]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setUserInitial("");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Sketchy
        </Link>
   
        <div className="flex items-center gap-3">
          {userInitial ? (
            <div className="relative group">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-r from-[#3C82F6] to-[#8B5CF6] text-white font-semibold cursor-pointer">
                {userInitial}
              </div>
              <div className="absolute right-0 top-full mt-2 w-32 rounded-lg bg-slate-800 border border-slate-700 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-1 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;