"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Code2, Loader2, X } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./landing.module.css";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  withPayment: boolean;
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSuccess,
  withPayment,
}: RegisterModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      element.close();
    };
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? "").trim(),
          email,
          password,
          phone: form.get("phone"),
          department: form.get("department"),
          batch: form.get("batch"),
          cgpa: "",
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || "We couldn’t create your account. Please try again.",
        );
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error)
        throw new Error(
          "Your account is ready, but automatic sign-in failed. Please use the sign-in link below.",
        );
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  function close() {
    if (loading) return;
    setError("");
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.registerDialog}
      aria-labelledby="register-title"
      aria-describedby="register-description"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }
      }}
    >
      <button
        className={styles.dialogClose}
        type="button"
        aria-label="Close registration"
        disabled={loading}
        onClick={close}
      >
        <X size={19} />
      </button>
      <span className={styles.dialogMark} aria-hidden="true">
        <Code2 size={23} />
      </span>
      <h2 id="register-title">Your next chapter.</h2>
      <p className={styles.dialogDescription} id="register-description">
        {withPayment
          ? "Create your account, then continue to KodeCraft Pro checkout. ₹3,999 for a full year."
          : "A space for your curiosity. Create an account to get started."}
      </p>
      <form
        className={styles.registerForm}
        onSubmit={handleSubmit}
        aria-busy={loading}
      >
        <div className={styles.formField}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
            disabled={loading}
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="register-phone">Phone number</label>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="10-digit number or +91…"
            required
            disabled={loading}
          />
        </div>
        <div className={styles.formColumns}>
          <div className={styles.formField}>
            <label htmlFor="register-department">Department</label>
            <input
              id="register-department"
              name="department"
              placeholder="e.g. CSE"
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="register-batch">Batch year</label>
            <input
              id="register-batch"
              name="batch"
              inputMode="numeric"
              placeholder="e.g. 2026"
              required
              disabled={loading}
            />
          </div>
        </div>
        <div className={styles.formField}>
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Choose a password"
            required
            disabled={loading}
          />
        </div>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={styles.formSubmit}>
          {loading ? (
            <>
              <Loader2 size={16} className={styles.spinner} /> Creating your
              account…
            </>
          ) : (
            <>
              {withPayment
                ? "Create account & continue to payment"
                : "Create your account"}
              <ArrowUpRight size={16} />
            </>
          )}
        </button>
      </form>
      <p className={styles.dialogLogin}>
        Already part of KodeCraft? <Link href="/login">Sign in</Link>
      </p>
    </dialog>
  );
}
