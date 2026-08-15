"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Code,
  LogIn,
  Zap,
  Trophy,
  BookOpen,
  GraduationCap,
  Sparkles,
  Terminal,
  Flame,
  Users,
  ArrowRight,
  ChevronDown,
  Star,
  GitBranch,
  Cpu,
  Braces,
  MousePointer2,
} from "lucide-react";

/* ─────────────────────── helpers ─────────────────────── */

const TYPING_LINES = [
  { text: 'const skill = "coding";', color: "text-cyan-400" },
  { text: "let level = 0;", color: "text-emerald-400" },
  { text: "", color: "" },
  { text: "while (true) {", color: "text-purple-400" },
  { text: "  level++;", color: "text-amber-400" },
  { text: "  learn(new Concept());", color: "text-pink-400" },
  { text: "  build(new Project());", color: "text-blue-400" },
  { text: "}", color: "text-purple-400" },
];

const FLOATING_ICONS = [
  { icon: Braces, x: "10%", y: "20%", delay: 0, color: "text-cyan-500/20" },
  { icon: GitBranch, x: "85%", y: "15%", delay: 0.5, color: "text-purple-500/20" },
  { icon: Cpu, x: "75%", y: "70%", delay: 1, color: "text-emerald-500/20" },
  { icon: Terminal, x: "15%", y: "75%", delay: 1.5, color: "text-pink-500/20" },
  { icon: Star, x: "90%", y: "45%", delay: 2, color: "text-amber-500/20" },
  { icon: Zap, x: "5%", y: "50%", delay: 0.8, color: "text-indigo-500/20" },
];

const STATS = [
  { value: "10K+", label: "Active Learners", icon: Users },
  { value: "500+", label: "Coding Challenges", icon: Flame },
  { value: "50+", label: "Live Contests", icon: Trophy },
  { value: "95%", label: "Placement Rate", icon: Star },
];

const FEATURES = [
  {
    title: "Interactive Courses",
    desc: "Learn by doing — not just watching. Every lesson has hands-on coding challenges built right in.",
    icon: BookOpen,
    gradient: "from-blue-500 to-cyan-400",
    glow: "rgba(59,130,246,0.3)",
  },
  {
    title: "Competitive Arena",
    desc: "Battle in real-time coding contests. Climb leaderboards and flex your rank like a true grinder.",
    icon: Trophy,
    gradient: "from-orange-500 to-amber-400",
    glow: "rgba(249,115,22,0.3)",
  },
  {
    title: "AI-Powered Hints",
    desc: "Stuck? Our AI tutor gives you smart nudges — not answers. Level up without the spoon-feeding.",
    icon: Sparkles,
    gradient: "from-violet-500 to-fuchsia-400",
    glow: "rgba(139,92,246,0.3)",
  },
  {
    title: "Earn Certifications",
    desc: "Complete tracks to unlock verifiable certificates. Share them on LinkedIn and your portfolio.",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-green-400",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    title: "Real-World Hackathons",
    desc: "Team up, build projects, and win prizes. The closest thing to shipping production code.",
    icon: Zap,
    gradient: "from-pink-500 to-rose-400",
    glow: "rgba(236,72,153,0.3)",
  },
  {
    title: "Streak & Badges",
    desc: "Keep your daily streak alive and collect rare badges. Gamification that actually motivates.",
    icon: Flame,
    gradient: "from-amber-500 to-yellow-400",
    glow: "rgba(245,158,11,0.3)",
  },
];

const LANGUAGES = [
  { name: "Python", color: "#3B82F6", icon: "🐍" },
  { name: "JavaScript", color: "#F59E0B", icon: "⚡" },
  { name: "C++", color: "#8B5CF6", icon: "⚙️" },
  { name: "Java", color: "#EF4444", icon: "☕" },
  { name: "TypeScript", color: "#06B6D4", icon: "🔷" },
  { name: "SQL", color: "#10B981", icon: "🗄️" },
];

/* ─────────────────────── Typing animation hook ─────────────────────── */

function useTypingAnimation() {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (currentLine >= TYPING_LINES.length) return;

    const line = TYPING_LINES[currentLine].text;

    if (currentChar <= line.length) {
      const timer = setTimeout(
        () => {
          setLines((prev) => {
            const next = [...prev];
            next[currentLine] = line.slice(0, currentChar);
            return next;
          });
          setCurrentChar((c) => c + 1);
        },
        line.length === 0 ? 300 : 45 + Math.random() * 35
      );
      return () => clearTimeout(timer);
    }

    // Line done, go next
    const pause = setTimeout(() => {
      setCurrentLine((l) => l + 1);
      setCurrentChar(0);
    }, 400);
    return () => clearTimeout(pause);
  }, [currentLine, currentChar]);

  return { lines, currentLine, currentChar, done: currentLine >= TYPING_LINES.length };
}

/* ─────────────────────── Particle background ─────────────────────── */

function ParticleField() {
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/[0.07]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── Cursor Glow (follows mouse) ─────────────────────── */

function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const leave = () => setVisible(false);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-50 h-[500px] w-[500px] rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
        x: pos.x - 250,
        y: pos.y - 250,
      }}
      animate={{ x: pos.x - 250, y: pos.y - 250 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    />
  );
}

/* ─────────────────────── Interactive Terminal ─────────────────────── */

function LiveTerminal() {
  const { lines, currentLine, done } = useTypingAnimation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Terminal glow */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 blur-xl opacity-60" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs font-medium text-gray-500 font-mono">
            your_journey.js
          </span>
        </div>

        {/* Code content */}
        <div className="p-5 font-mono text-sm leading-relaxed min-h-[220px]">
          {TYPING_LINES.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 select-none text-gray-600 w-4 text-right">
                {i + 1}
              </span>
              <span className={line.color}>
                {i < lines.length ? lines[i] : ""}
                {i === currentLine && !done && (
                  <motion.span
                    className="inline-block w-[2px] h-4 bg-cyan-400 ml-0.5 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span>JavaScript</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Scrolling Language Ticker ─────────────────────── */

function LanguageTicker() {
  const doubled = [...LANGUAGES, ...LANGUAGES];
  return (
    <div className="relative w-full overflow-hidden py-6">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050508] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050508] to-transparent z-10" />
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((lang, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-full border border-white/5 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-gray-300 hover:border-white/15 hover:bg-white/[0.06] transition-all cursor-default shrink-0"
          >
            <span className="text-lg">{lang.icon}</span>
            <span>{lang.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Feature Card ─────────────────────── */

function FeatureCard({
  feat,
  index,
}: {
  feat: (typeof FEATURES)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = feat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]"
    >
      {/* Hover glow */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-px rounded-2xl"
            style={{
              background: `radial-gradient(400px circle at 50% 50%, ${feat.glow}, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div
          className={`mb-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${feat.gradient} p-3 shadow-lg`}
          style={{ boxShadow: `0 8px 30px ${feat.glow}` }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">{feat.title}</h3>
        <p className="text-sm leading-relaxed text-gray-400">{feat.desc}</p>
      </div>

      {/* Corner accent */}
      <div
        className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${feat.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30`}
      />
    </motion.div>
  );
}

/* ─────────────────────── Stats Bar ─────────────────────── */

function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6"
    >
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.04]"
          >
            <Icon className="mx-auto mb-2 h-5 w-5 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-2xl font-extrabold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────── Interactive CTA Section ─────────────────────── */

function CTASection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 px-6 py-16 text-center md:px-16 md:py-20"
    >
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-[100px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-600/20 blur-[100px]"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_40px_rgba(99,102,241,0.4)]"
        >
          <Zap className="h-8 w-8 text-white" />
        </motion.div>

        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Ready to level up your{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            coding game?
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-400 leading-relaxed">
          Join the community of ambitious coders who are building their future
          one commit at a time. It&apos;s free to start.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-base font-bold text-gray-950 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-10 bg-gradient-to-r from-transparent via-indigo-300/30 to-transparent" />
            </div>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <Code className="h-5 w-5" />
            I already have an account
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function HeroLanding() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const [activeWord, setActiveWord] = useState(0);
  const WORDS = ["Build", "Ship", "Compete", "Conquer"];

  useEffect(() => {
    const interval = setInterval(
      () => setActiveWord((prev) => (prev + 1) % WORDS.length),
      2200
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050508] font-sans selection:bg-purple-500/30">
      <CursorGlow />

      {/* ─────── Ambient Background ─────── */}
      <div className="absolute inset-0 z-0">
        <ParticleField />
        {/* Big gradient orbs */}
        <motion.div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-indigo-600/15 blur-[150px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-5%] right-[-5%] h-[400px] w-[600px] rounded-full bg-purple-600/10 blur-[120px]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[30%] left-[-5%] h-[350px] w-[450px] rounded-full bg-cyan-600/8 blur-[100px]"
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)]" />
      </div>

      {/* ─────── Floating Code Icons ─────── */}
      {FLOATING_ICONS.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            className={`absolute z-0 ${item.color}`}
            style={{ left: item.x, top: item.y }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut",
            }}
          >
            <Icon className="h-8 w-8 md:h-10 md:w-10" />
          </motion.div>
        );
      })}

      {/* ─────── Nav ─────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Code className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            KodeCraft
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.nav>

      {/* ─────── Hero ─────── */}
      <div ref={heroRef} className="relative z-10">
        <motion.main
          style={{ y: heroY, opacity: heroOpacity }}
          className="flex flex-col items-center justify-center px-4 pt-8 pb-10 text-center md:pt-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 inline-flex cursor-default items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-5 py-2 text-sm font-medium text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
            Built for the next generation of coders
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto max-w-5xl text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl leading-[0.95]"
          >
            <span className="block">Learn to Code.</span>
            <span className="mt-2 block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeWord}
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.4 }}
                  className="inline-block bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent"
                >
                  {WORDS[activeWord]}
                </motion.span>
              </AnimatePresence>
              <span className="text-gray-500">{" "}the Future.</span>
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed sm:text-xl"
          >
            The coding platform that feels like a game. Interactive courses,
            real-time battles, hackathons & AI-powered learning — built for{" "}
            <span className="text-white font-medium">ambitious students</span>{" "}
            who want to ship, not just study.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-9 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]"
            >
              <Zap className="h-5 w-5" />
              Start Learning Now
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-10 bg-white/20" />
              </div>
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-gray-300 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <MousePointer2 className="h-5 w-5" />
              Explore Curriculum
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </motion.div>

          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-16 w-full max-w-lg px-4"
          >
            <LiveTerminal />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-12"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-gray-500"
            >
              <span className="text-xs font-medium uppercase tracking-widest">
                Scroll to explore
              </span>
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </motion.main>
      </div>

      {/* ─────── Language Ticker ─────── */}
      <section className="relative z-10 mt-4 border-y border-white/5 bg-white/[0.01]">
        <LanguageTicker />
      </section>

      {/* ─────── Stats ─────── */}
      <section className="relative z-10 px-4 py-20 md:py-24">
        <StatsBar />
      </section>

      {/* ─────── Features Grid ─────── */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              go pro
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-400">
            From zero to hero. We&apos;ve got every tool a GenZ coder needs to
            crush it.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={i} feat={feat} index={i} />
          ))}
        </div>
      </section>

      {/* ─────── CTA ─────── */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24 md:px-8">
        <CTASection />
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="relative z-10 border-t border-white/5 bg-white/[0.01] px-6 py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Code className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-400">KodeCraft</span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} KodeCraft. Built with 💜 for the
            next generation of developers.
          </p>
        </div>
      </footer>
    </div>
  );
}
