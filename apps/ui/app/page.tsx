"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import { backend_url } from "../config";

export default function Home() {
  const router = useRouter();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joinSlug, setJoinSlug] = useState("");
  const [roomName, setRoomName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    const handleClick = (e: Event) => {
      e.preventDefault();
      const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute("href");
      if (targetId === "#") return;
      const targetElement = document.querySelector(targetId!);
      targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    anchors.forEach((anchor) => anchor.addEventListener("click", handleClick));
    return () => anchors.forEach((anchor) => anchor.removeEventListener("click", handleClick));
  }, []);

  const joinRoom = async (slug: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${backend_url}/room/${encodeURIComponent(slug)}`);
      const result = await response.json();
      if (!response.ok || !result?.data?.id) {
        throw new Error(result?.message ?? "Room not found");
      }
      router.push(`/canvas/${result.data.id}`);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (name: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("Please sign in to create a room.");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1500);
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`${backend_url}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ name }),
      });

      // try to parse JSON safely (avoid `any` and unused catch vars to satisfy ESLint)
      let result: unknown = null;
      try {
        result = await response.json();
      } catch {
        // Non-JSON response (ignore)
      }

      // Normalize parsed result into a typed shape we can safely inspect
      const parsed = (result as Record<string, unknown> | null) ?? null;

      if (!response.ok) {
        // prefer backend-provided message if present and a string
        const msg = parsed && typeof parsed['message'] === 'string'
          ? (parsed['message'] as string)
          : `Server responded ${response.status}`;
        throw new Error(msg);
      }

      // backend may respond with different shapes; attempt safe extraction
      const data = parsed && (parsed['data'] as Record<string, unknown> | undefined);
      const roomId = parsed && (
        parsed['roomId'] ??
        (data && (data['roomId'] ?? data['id'])) ??
        parsed['id']
      );

      if (!roomId) {
        const errMsg = parsed && typeof parsed['message'] === 'string' ? (parsed['message'] as string) : "Unable to create room";
        throw new Error(errMsg);
      }

      router.push(`/canvas/${String(roomId)}`);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050915] text-slate-100">
      <Header />
      <main>
        <Hero />
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6 md:px-10">
            <div className="rounded-3xl border border-white/10 bg-[#0A0F1C]/80 p-10 shadow-[0_40px_80px_-48px_rgba(60,130,246,0.6)]">
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-50 md:text-3xl">
                    Jump into a live canvas
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 md:text-base">
                    Join an existing room or spin up a fresh space for your team in seconds.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      setStatus(null);
                      setJoinSlug("");
                      setIsJoinOpen(true);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-[#5BA8FF]/40 hover:bg-white/15 sm:w-auto"
                  >
                    Join a room
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      if (!token) {
                        setStatus("Please sign in to create a room.");
                        setTimeout(() => {
                          window.location.href = "/signin";
                        }, 1500);
                        return;
                      }
                      setStatus(null);
                      setRoomName("");
                      setIsCreateOpen(true);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-[#3C82F6] to-[#8B5CF6] px-6 py-3 text-sm font-medium text-white shadow-[0_20px_40px_-24px_rgba(60,130,246,0.7)] transition hover:opacity-90 sm:w-auto"
                  >
                    Create a room
                  </button>
                </div>
              </div>
              {status && (
                <p className="mt-4 text-sm text-rose-300">{status}</p>
              )}
            </div>
          </div>
        </section>
        <HowItWorks />
      </main>
      <Footer />

      {(isJoinOpen || isCreateOpen) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0C1326]/95 p-8 shadow-[0_40px_80px_-32px_rgba(60,130,246,0.7)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-100">
                {isJoinOpen ? "Join a room" : "Create a room"}
              </h3>
              <button
                onClick={() => {
                  setIsJoinOpen(false);
                  setIsCreateOpen(false);
                  setStatus(null);
                }}
                className="text-slate-400 transition hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (isJoinOpen) {
                  if (!joinSlug.trim()) {
                    setStatus("Enter a room slug.");
                    return;
                  }
                  try {
                    await joinRoom(joinSlug.trim());
                    setIsJoinOpen(false);
                    setJoinSlug("");
                  } catch {
                    // Error is already handled in joinRoom
                  }
                } else {
                  if (!roomName.trim()) {
                    setStatus("Enter a room name.");
                    return;
                  }
                  try {
                    await createRoom(roomName.trim());
                    setIsCreateOpen(false);
                    setRoomName("");
                  } catch {
                    // Error is already handled in createRoom
                  }
                }
              }}
            >
              <label className="block text-sm text-slate-300">
                {isJoinOpen ? "Room slug" : "Room name"}
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-[#5BA8FF]/40"
                  placeholder={isJoinOpen ? "e.g. design-review" : "e.g. team-sync"}
                  value={isJoinOpen ? joinSlug : roomName}
                  onChange={(event) =>
                    isJoinOpen
                      ? setJoinSlug(event.target.value)
                      : setRoomName(event.target.value)
                  }
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinOpen(false);
                    setIsCreateOpen(false);
                    setStatus(null);
                  }}
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-300 transition hover:border-white/30 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#3C82F6] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? "Please wait…" : isJoinOpen ? "Join" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
