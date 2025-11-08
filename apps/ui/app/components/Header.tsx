
"use client";
import React, { useEffect, useState } from "react";
import { Menu, X, PenLine } from "lucide-react";
import Link from "next/link";
import { useinfo } from "../hooks/useinfo";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userInitial, setUserInitial] = useState("");

  const { loading: infoLoading, info } = useinfo();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/70 shadow-md py-3" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PenLine className="h-8 w-8 text-blue-500" />
            <span className="ml-2 text-xl font-bold text-gray-900">Sketchy</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-900 hover:text-blue-500 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-900 hover:text-blue-500 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-900 hover:text-blue-500 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-gray-900 hover:text-blue-500 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex space-x-4">
            {userInitial ? (
              <div
                className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold"
                title={localStorage.getItem("name") || ""}
              >
                {userInitial}
              </div>
            ) : (
              <Link href="/signin">
                <button className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">Log in</button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-600 hover:text-blue-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                How It Works
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Pricing
              </a>
              <a href="#faq" className="text-gray-600 hover:text-blue-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                FAQ
              </a>

              <div className="flex flex-col space-y-2 pt-2">
                {userInitial ? (
                  <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold">
                    {userInitial}
                  </div>
                ) : (
                  <Link href="/signin">
                    <button className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors text-left">Log in</button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;