import React from 'react';
import { Pencil, Users, Share2 } from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (

<section id="how-it-works" className="relative overflow-hidden bg-[#050915] py-24">
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#111a33]/70 via-transparent to-[#3C82F6]/10" />
  <div className="relative mx-auto flex max-w-5xl flex-col gap-14 px-6 md:px-10">
    <div className="text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#86b7ff]">
        Sketch together
      </span>
      <h2 className="mt-6 text-3xl font-semibold text-slate-100 md:text-4xl">
        Flow through your ideas in three simple steps
      </h2>
      <p className="mt-4 text-base text-slate-400 md:text-lg">
        Sketchy keeps your sessions light, fast, and effortlessly collaborative—no onboarding required.
      </p>
    </div>

    <div className="grid gap-8 md:grid-cols-3">
      {[
        {
          icon: Pencil,
          title: "Draw freely",
          description:
            "Shape diagrams and wireframes with hand-drawn charm. Infinite canvas, zero friction.",
        },
        {
          icon: Users,
          title: "Collaborate live",
          description:
            "Invite teammates into the same canvas. Watch cursors move and ideas evolve together.",
        },
        {
          icon: Share2,
          title: "Share instantly",
          description:
            "Export snapshots, ship links, or reopen any room later. Your work stays synced and ready.",
        },
      ].map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#0A0F1C]/60 p-6 shadow-[0_40px_80px_-48px_rgba(60,130,246,0.6)] transition hover:border-[#5BA8FF]/40"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3C82F6]/40 to-[#8B5CF6]/40 text-[#9dc4ff]">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-slate-50">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      ))}
    </div>
  </div>
</section>

  );
};

export default HowItWorks;
