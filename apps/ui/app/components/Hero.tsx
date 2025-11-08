import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#0A0F1C]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#111a33] via-[#0a0f1c] to-[#05070d]" />
      <div className="absolute left-1/2 top-[-20%] h-96 w-96 -translate-x-1/2 rounded-full bg-[#3C82F6]/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-16 px-6 py-24 md:flex-row md:items-center md:px-10 lg:px-16">
        <div className="md:w-1/2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#5BA8FF]" />
            Sketchy – Instant collaborative canvases
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-50 md:text-5xl lg:text-6xl">
            Draw. Brainstorm. Build together in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5BA8FF] via-[#8B5CF6] to-[#F472B6]">
              real time.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 md:text-xl">
            Sketchy is the virtual whiteboard built for teams who think with their
            hands. Sketch with a hand-drawn vibe, sync instantly, and keep everyone
            aligned—whether they’re across the table or across the globe.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-xl bg-gradient-to-r from-[#3C82F6] to-[#8B5CF6] px-8 py-3 text-sm font-medium text-white shadow-[0_20px_40px_-24px_rgba(60,130,246,0.7)] transition hover:opacity-90">
              Start drawing now
            </button>
            <a
              href="#how-it-works"
              className="group inline-flex items-center justify-center rounded-xl border border-white/15 px-8 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
            >
              See how it works
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0A0F1C] bg-white/10 text-sm font-semibold text-white backdrop-blur"
                >
                  {i}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-300">
              <span className="font-medium text-white">10,000+</span> creators sketching live every day
            </p>
          </div>
        </div>

        <div className="relative md:w-1/2">
          <div className="absolute inset-0 -translate-x-10 rounded-3xl bg-gradient-to-br from-[#3C82F6]/30 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A]/60 shadow-2xl shadow-[#3C82F6]/20">
            <img
              src="https://images.pexels.com/photos/1181268/pexels-photo-1181268.jpeg"
              alt="Sketchy live canvas preview"
              className="w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C]/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-4 py-3 text-sm text-slate-200 backdrop-blur">
              Live in room <span className="font-semibold text-white">design-sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;