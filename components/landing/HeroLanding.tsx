"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSession } from "next-auth/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Check,
  Code2,
  Command,
  FileCode2,
  GitBranch,
  Layers3,
  Menu,
  Play,
  Plus,
  ShieldCheck,
  Terminal,
  Trophy,
  X,
} from "lucide-react";
import RegisterModal from "./RegisterModal";
import styles from "./landing.module.css";

const paths = [
  {
    title: "Web development",
    category: "Development",
    number: "01",
    description:
      "Turn a blank page into something people can use. Start with the building blocks of the web.",
    tags: "HTML · CSS · JavaScript",
    style: "webArt",
    label: "BUILD FOR THE WEB",
  },
  {
    title: "Python foundations",
    category: "Development",
    number: "02",
    description:
      "Think like a programmer. Build a strong foundation, one small, satisfying solution at a time.",
    tags: "Python · Logic · Problem solving",
    style: "pythonArt",
    label: "START WITH THE ESSENTIALS",
  },
  {
    title: "Data structures & algorithms",
    category: "Problem solving",
    number: "03",
    description:
      "Go beyond getting it to work. Learn to break down problems and write thoughtful, efficient code.",
    tags: "DSA · Patterns · Interview prep",
    style: "dsaArt",
    label: "THINK A LITTLE DEEPER",
  },
];
const questions = [
  {
    question: "Can I start if I’ve never coded before?",
    answer:
      "Yes. Start with the fundamentals, follow the lessons at your own pace, and put each new concept into practice with coding exercises. You can move on to projects and more challenging problems as you build confidence.",
  },
  {
    question: "Do I need to install any software?",
    answer:
      "The built-in editor lets you write, run, and submit your code directly in your browser. You can get started without setting up a local development environment.",
  },
  {
    question: "What’s included in KodeCraft Pro?",
    answer:
      "Pro includes access to courses, the practice arena, coding contests, hackathons, auto-graded assignments, the AI coding assistant, and the placement portal. The plan is ₹3,999 for one year.",
  },
  {
    question: "How does the annual payment work?",
    answer:
      "You pay once for 12 months of access through Razorpay. There is no automatic renewal. Create your account, then select the Pro plan to continue to secure checkout.",
  },
];
type PaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type CheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: PaymentResponse) => Promise<void>;
  theme: { color: string };
  modal: { ondismiss: () => void };
};
type CheckoutWindow = Window & {
  Razorpay?: new (options: CheckoutOptions) => {
    open: () => void;
    on: (event: string, callback: () => void) => void;
  };
};

function Brand() {
  return (
    <a className={styles.brand} href="#top" aria-label="KodeCraft home">
      <span className={styles.brandMark}>
        <Code2 size={21} strokeWidth={1.8} />
      </span>
      KodeCraft<span className={styles.brandPeriod}>.</span>
    </a>
  );
}

function Workspace() {
  const scene = useRef<HTMLDivElement>(null);
  const [hasRun, setHasRun] = useState(false);
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty(
      "--tilt-y",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 7}deg`,
    );
    scene.current?.style.setProperty(
      "--tilt-x",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * -5}deg`,
    );
  }
  function resetTilt() {
    scene.current?.style.setProperty("--tilt-x", "0deg");
    scene.current?.style.setProperty("--tilt-y", "0deg");
  }
  return (
    <div
      className={styles.workspace}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div className={styles.orbit} aria-hidden="true" />
      <span className={styles.sceneNote}>
        A LITTLE PRACTICE. A LOT OF POSSIBILITY.
      </span>
      <div className={styles.scene} ref={scene}>
        <div className={styles.backSheet} aria-hidden="true" />
        <div className={styles.middleSheet} aria-hidden="true" />
        <div className={styles.editor}>
          <div className={styles.editorTop}>
            <span className={styles.windowDots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>your next chapter</span>
            <Command size={13} />
          </div>
          <div className={styles.editorTabs}>
            <span>
              <FileCode2 size={13} /> hello_world.py <X size={11} />
            </span>
            <Plus size={13} />
          </div>
          <div className={styles.editorBody}>
            <div className={styles.editorRail} aria-hidden="true">
              <Layers3 size={17} />
              <Code2 size={17} />
              <GitBranch size={17} />
              <span />
              <span className={styles.railAvatar}>k.</span>
            </div>
            <div
              className={styles.code}
              aria-label="Python example: print a message for every step in your learning journey"
            >
              <div>
                <b>1</b>
                <span className={styles.comment}>
                  # Great things start with a first line.
                </span>
              </div>
              <div>
                <b>2</b>
                <span />
              </div>
              <div>
                <b>3</b>
                <span>
                  journey = [<em>"learn"</em>, <em>"build"</em>, <em>"grow"</em>
                  ]
                </span>
              </div>
              <div>
                <b>4</b>
                <span />
              </div>
              <div>
                <b>5</b>
                <span>
                  <strong>for</strong> step <strong>in</strong> journey:
                </span>
              </div>
              <div>
                <b>6</b>
                <span>
                  {" "}
                  <i>print</i>(<em>f"Time to {"{step}"}."</em>)
                </span>
              </div>
              <div>
                <b>7</b>
                <span />
              </div>
              <div>
                <b>8</b>
                <span className={styles.comment}>
                  # Your future is a work in progress.
                </span>
              </div>
              <div>
                <b>9</b>
                <span className={styles.codeCaret} />
              </div>
            </div>
          </div>
          <div className={styles.terminal}>
            <div className={styles.terminalTop}>
              <span>
                <Terminal size={12} /> OUTPUT <small>INTERACTIVE PREVIEW</small>
              </span>
              <button
                onClick={() => setHasRun(!hasRun)}
                aria-label={hasRun ? "Reset code preview" : "Run code preview"}
              >
                <Play size={10} fill="currentColor" />
                {hasRun ? "Reset" : "Run code"}
              </button>
            </div>
            <div className={styles.output} role="status" aria-live="polite">
              {hasRun ? (
                <>
                  <span>Time to learn. Time to build. Time to grow.</span>
                  <small>
                    <Check size={11} /> Process finished successfully
                  </small>
                </>
              ) : (
                <>
                  <span className={styles.outputHint}>
                    Your first step is ready.
                  </span>
                  <small>Press Run code to see what happens.</small>
                </>
              )}
            </div>
          </div>
          <div className={styles.editorStatus}>
            <span>
              <GitBranch size={10} /> main
            </span>
            <span>
              Python 3 <Check size={10} />
            </span>
          </div>
        </div>
        <div className={styles.lessonCard} aria-hidden="true">
          <span className={styles.lessonIcon}>
            <BookOpen size={19} />
          </span>
          <span>
            <small>ONE STEP AT A TIME</small>
            <strong>Small wins. Real progress.</strong>
          </span>
          <span className={styles.progressRing}>
            <Check size={15} />
          </span>
        </div>
        <div className={styles.codeKey} aria-hidden="true">
          <Braces size={37} strokeWidth={1.4} />
          <span>make something.</span>
        </div>
      </div>
      <span className={styles.sceneCaption}>
        <span /> YOUR IDEAS, IN THE MAKING <ArrowUpRight size={13} />
      </span>
    </div>
  );
}

function PathArt({ kind }: { kind: string }) {
  return (
    <div className={styles.pathArt} aria-hidden="true">
      {kind === "webArt" ? (
        <div className={styles.miniBrowser}>
          <div>
            <i />
            <i />
            <i />
          </div>
          <section>
            <span />
            <span />
            <span />
            <span />
          </section>
          <Code2 />
        </div>
      ) : kind === "pythonArt" ? (
        <div className={styles.pythonBlocks}>
          <span>
            py<span>01</span>
          </span>
          <span>
            <Braces size={42} strokeWidth={1.3} />
          </span>
        </div>
      ) : (
        <div className={styles.treeArt}>
          <i />
          <i />
          <i />
          <span>01</span>
          <span>02</span>
          <span>03</span>
        </div>
      )}
    </div>
  );
}

export default function HeroLanding() {
  const { data: session, status } = useSession();
  const [showRegister, setShowRegister] = useState(false);
  const [registerWithPayment, setRegisterWithPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("All paths");
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function handleCheckout() {
    setCheckoutError("");
    const Razorpay = (window as CheckoutWindow).Razorpay;
    if (!Razorpay) {
      setCheckoutError(
        "Secure checkout hasn’t loaded yet. Please check your connection and try again.",
      );
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok)
        throw new Error("We couldn’t start checkout. Please try again.");
      const data = await res.json();
      const checkout = new Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "KodeCraft",
        description: "KodeCraft Pro — 1 Year Access",
        order_id: data.order_id,
        handler: async (response) => {
          try {
            const verification = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verification.ok)
              throw new Error(
                "Your payment could not be verified. Please check your payment status before trying again.",
              );
            window.location.href = "/";
          } catch (error) {
            setCheckoutError(
              error instanceof Error
                ? error.message
                : "Unable to verify payment.",
            );
            setIsProcessing(false);
          }
        },
        theme: { color: "#565d43" },
        modal: { ondismiss: () => setIsProcessing(false) },
      });
      checkout.on("payment.failed", () => {
        setIsProcessing(false);
        setCheckoutError(
          "Payment wasn’t completed. You can try again when you’re ready.",
        );
      });
      checkout.open();
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to open checkout. Please try again.",
      );
      setIsProcessing(false);
    }
  }
  function handleGetStarted(withPayment = false) {
    setMenuOpen(false);
    setCheckoutError("");
    if (status === "loading" || isProcessing) return;
    if (session) {
      if (withPayment) void handleCheckout();
      else window.location.href = "/";
    } else {
      setRegisterWithPayment(withPayment);
      setShowRegister(true);
    }
  }

  return (
    <div className={styles.landing} id="top">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setCheckoutReady(true)}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        withPayment={registerWithPayment}
        onSuccess={() => {
          setShowRegister(false);
          if (registerWithPayment) void handleCheckout();
          else window.location.href = "/";
        }}
      />
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <Brand />
          <nav className={styles.desktopNav} aria-label="Main navigation">
            <a href="#paths">Learning paths</a>
            <a href="#experience">The experience</a>
            <a href="#pricing">Membership</a>
          </nav>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.signIn}>
              Sign in <ArrowUpRight size={14} />
            </Link>
            <button
              className={styles.smallButton}
              disabled={status === "loading"}
              onClick={() => handleGetStarted()}
            >
              Start your journey <ArrowRight size={15} />
            </button>
            <button
              ref={menuButton}
              className={styles.menuButton}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            className={styles.mobileNav}
            aria-label="Mobile navigation"
          >
            <a href="#paths" onClick={() => setMenuOpen(false)}>
              Learning paths <ArrowUpRight size={16} />
            </a>
            <a href="#experience" onClick={() => setMenuOpen(false)}>
              The experience <ArrowUpRight size={16} />
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>
              Membership <ArrowUpRight size={16} />
            </a>
            <button onClick={() => handleGetStarted()}>
              Start your journey <ArrowRight size={16} />
            </button>
          </nav>
        )}
      </header>
      <main id="main">
        <section
          className={`${styles.container} ${styles.hero}`}
          aria-labelledby="hero-title"
        >
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span className={styles.tinyStar}>✳</span> FOR THE CRAFT OF
              CODING
            </div>
            <h1 id="hero-title">
              A little curiosity.
              <br />A whole world
              <br />
              of <em>possibility.</em>
            </h1>
            <p>
              Learn to code. Build things that matter.
              <br className={styles.desktopBreak} /> Find your people. Your next
              chapter starts here.
            </p>
            <div className={styles.heroActions}>
              <button
                className={styles.primaryButton}
                disabled={status === "loading"}
                onClick={() => handleGetStarted()}
              >
                Find your starting point <ArrowUpRight size={18} />
              </button>
              <a href="#experience" className={styles.textLink}>
                <span className={styles.playCircle}>
                  <Play size={10} fill="currentColor" />
                </span>{" "}
                Take a look inside
              </a>
            </div>
            <div className={styles.heroFootnote}>
              <span className={styles.smallCheck}>
                <Check size={12} />
              </span>{" "}
              Learn at your pace <span className={styles.dot} /> Build from day
              one
            </div>
          </div>
          <Workspace />
          <div className={styles.heroBottom}>
            <span>A SPACE TO LEARN. A PLACE TO BECOME.</span>
            <a href="#paths">
              SCROLL TO EXPLORE <ArrowDown size={13} />
            </a>
          </div>
        </section>
        <section
          className={styles.languageBand}
          aria-label="Languages you can explore"
        >
          <div className={styles.container}>
            <p>
              Big ideas.
              <br />
              <strong>Many languages.</strong>
            </p>
            <div className={styles.languageList}>
              <span>
                <Braces /> Python
              </span>
              <span>
                <span className={styles.jsIcon}>JS</span> JavaScript
              </span>
              <span>
                <Code2 /> C++
              </span>
              <span>
                <span className={styles.javaIcon}>J</span> Java
              </span>
              <span>
                <span className={styles.tsIcon}>TS</span> TypeScript
              </span>
              <span>
                <Layers3 /> SQL
              </span>
            </div>
          </div>
        </section>
        <section
          id="paths"
          className={`${styles.container} ${styles.pathsSection}`}
          aria-labelledby="paths-title"
        >
          <div className={styles.sectionTop}>
            <div>
              <div className={styles.eyebrow}>01 / FIND YOUR DIRECTION</div>
              <h2 id="paths-title">
                Good things start
                <br />
                with <em>a first step.</em>
              </h2>
            </div>
            <p>
              Follow your curiosity. Whether it’s your first line
              <br className={styles.desktopBreak} /> of code or your next big
              challenge, start here.
            </p>
          </div>
          <div className={styles.pathToolbar}>
            <div className={styles.filters} aria-label="Filter learning paths">
              {["All paths", "Development", "Problem solving"].map((filter) => (
                <button
                  key={filter}
                  aria-pressed={category === filter}
                  onClick={() => setCategory(filter)}
                  className={category === filter ? styles.activeFilter : ""}
                >
                  {filter}
                </button>
              ))}
            </div>
            <Link href="/courses" className={styles.textLink}>
              Explore all courses <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className={styles.pathGrid}>
            {paths
              .filter(
                (path) =>
                  category === "All paths" || path.category === category,
              )
              .map((path) => (
                <Link
                  href="/courses"
                  key={path.title}
                  className={styles.pathCard}
                >
                  <div className={`${styles.pathCover} ${styles[path.style] ?? ""}`}>
                    <span className={styles.pathNumber}>
                      PATH / {path.number}
                    </span>
                    <PathArt kind={path.style} />
                    <span className={styles.pathLabel}>{path.label}</span>
                    <span className={styles.pathArrow}>
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                  <div className={styles.pathInfo}>
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                    <span>{path.tags}</span>
                  </div>
                </Link>
              ))}
          </div>
          <p className={styles.pathNote}>
            Explore a direction above, then find your next course in the
            catalog.
          </p>
        </section>
        <section
          id="experience"
          className={styles.experience}
          aria-labelledby="experience-title"
        >
          <div className={`${styles.container} ${styles.experienceInner}`}>
            <div className={styles.experienceCopy}>
              <div className={styles.eyebrow}>02 / MORE THAN A COURSE</div>
              <h2 id="experience-title">
                Knowledge is good.
                <br />
                <em>Making is better.</em>
              </h2>
              <p>
                The real learning happens when you try, get stuck, and figure it
                out. We’ve made room for all of it.
              </p>
              <a href="#pricing" className={styles.lightButton}>
                Meet your new workspace <ArrowUpRight size={17} />
              </a>
              <div className={styles.craftStamp} aria-hidden="true">
                <Braces size={39} strokeWidth={1.2} />
                <span>
                  LESS WATCHING.
                  <br />
                  MORE MAKING.
                </span>
              </div>
            </div>
            <div className={styles.experienceList}>
              {[
                {
                  number: "01",
                  icon: Terminal,
                  title: "A place to get your hands on it.",
                  text: "Write, run, and refine in a browser-based IDE. Get instant feedback and turn “I think I get it” into “I built it.”",
                  href: "/practice",
                  label: "Explore the practice arena",
                },
                {
                  number: "02",
                  icon: Trophy,
                  title: "A little friendly competition.",
                  text: "Test your thinking in coding contests. Team up for hackathons. Find out what you can make when you make it together.",
                  href: "/contest",
                  label: "Explore coding contests",
                },
                {
                  number: "03",
                  icon: GitBranch,
                  title: "Somewhere to go from here.",
                  text: "Bring your skills to your next opportunity. Practice for interviews and explore jobs and internships as you grow.",
                  href: "/jobs",
                  label: "Explore opportunities",
                },
              ].map((feature) => (
                <Link
                  href={feature.href}
                  key={feature.number}
                  className={styles.experienceItem}
                  aria-label={feature.label}
                >
                  <span className={styles.featureNumber}>{feature.number}</span>
                  <div>
                    <feature.icon size={22} strokeWidth={1.3} />
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                  <ArrowUpRight size={20} />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section
          id="pricing"
          className={`${styles.container} ${styles.pricingSection}`}
          aria-labelledby="pricing-title"
        >
          <div className={styles.pricingIntro}>
            <div className={styles.eyebrow}>03 / INVEST IN YOUR CURIOSITY</div>
            <h2 id="pricing-title">
              Your ambition.
              <br />
              <em>No small print.</em>
            </h2>
            <p>
              One membership for everything you need to learn, practice, and
              take your next step.
            </p>
            <div className={styles.pricingPromise}>
              <ShieldCheck size={20} />
              <span>
                One payment. A full year of possibility.
                <br />
                <small>No automatic renewal.</small>
              </span>
            </div>
          </div>
          <div className={styles.priceCard}>
            <div className={styles.priceHeading}>
              <span>
                <span className={styles.tinyStar}>✳</span> KodeCraft Pro
              </span>
              <span className={styles.planBadge}>THE WHOLE WORKSPACE</span>
            </div>
            <div className={styles.price}>
              <span>₹3,999</span>
              <span>/ year</span>
            </div>
            <p className={styles.priceSubtitle}>
              12 months. Every feature. Room to grow.
            </p>
            <div className={styles.priceRule} />
            <ul>
              {[
                "Every course & learning module",
                "Practice arena & coding challenges",
                "Live contests & hackathons",
                "Browser IDE & AI coding assistant",
                "Auto-graded assignments",
                "Placement & internship portal",
              ].map((feature) => (
                <li key={feature}>
                  <Check size={15} />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={styles.primaryButton}
              disabled={
                isProcessing ||
                status === "loading" ||
                (Boolean(session) && !checkoutReady)
              }
              onClick={() => handleGetStarted(true)}
            >
              {isProcessing
                ? "Opening secure checkout…"
                : "Make room for what’s next"}
              <ArrowUpRight size={18} />
            </button>
            <span className={styles.secureNote}>
              <ShieldCheck size={13} /> Secure checkout with Razorpay
            </span>
          </div>
        </section>
        <section
          className={`${styles.container} ${styles.faqSection}`}
          aria-labelledby="faq-title"
        >
          <div>
            <div className={styles.eyebrow}>
              A FEW THINGS YOU MIGHT BE WONDERING
            </div>
            <h2 id="faq-title">
              Curiosity, <em>answered.</em>
            </h2>
          </div>
          <div className={styles.faqList}>
            {questions.map((item) => (
              <details key={item.question} name="landing-faq">
                <summary>
                  {item.question}
                  <Plus size={18} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={`${styles.container} ${styles.closing}`}>
          <span className={styles.tinyStar} aria-hidden="true">
            ✳
          </span>
          <p>YOU DON’T NEED TO HAVE IT ALL FIGURED OUT.</p>
          <h2>
            Just bring <em>your curiosity.</em>
          </h2>
          <button
            className={styles.primaryButton}
            disabled={status === "loading"}
            onClick={() => handleGetStarted()}
          >
            Let’s make a start <ArrowUpRight size={18} />
          </button>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <Brand />
          <span>Made for the work in progress.</span>
          <div>
            <a href="#paths">Explore</a>
            <Link href="/login">Sign in</Link>
            <a href="#top" aria-label="Back to top">
              <ArrowUpRight size={18} />
            </a>
          </div>
          <small>© {new Date().getFullYear()} KodeCraft</small>
        </div>
      </footer>
      {checkoutError && (
        <div className={styles.checkoutNotice} role="alert">
          <p>{checkoutError}</p>
          <button
            onClick={() => setCheckoutError("")}
            aria-label="Dismiss checkout message"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
