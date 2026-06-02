"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, X, ImagePlus, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 data URL
}

export default function AskAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isClosing) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, isClosing]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasNewMessage(false);
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be under 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Reset file input for re-upload
      e.target.value = "";
    },
    []
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if ((!trimmed && !pendingImage) || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      image: pendingImage || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask-ai/doubt-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.image ? { image: m.image } : {}),
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again in a moment. 🔄",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, pendingImage, isLoading, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          id="ask-ai-doubt-btn"
          onClick={handleOpen}
          className="fixed right-5 bottom-24 z-50 md:bottom-6 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition-all hover:scale-105 hover:brightness-110 active:scale-95 animate-ai-btn cursor-pointer"
          aria-label="Have Doubt? Ask AI"
        >
          <div className="relative flex h-7 w-7 items-center justify-center">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-300" />
            </span>
          </div>
          <span className="hidden sm:inline">Have Doubt? Ask AI</span>
          <span className="sm:hidden">Ask AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed right-3 bottom-24 z-50 flex flex-col md:right-6 md:bottom-6 w-[calc(100vw-1.5rem)] max-w-[420px] rounded-2xl border border-white/10 bg-[#0d0d0d]/95 shadow-[0_0_60px_rgba(99,102,241,0.15)] backdrop-blur-2xl ${isClosing ? "animate-ai-chat-out" : "animate-ai-chat-in"}`}
          style={{ height: "min(600px, calc(100dvh - 7.5rem))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-white/5 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  KodeCraft AI
                </h3>
                <p className="text-[10px] text-indigo-300/80">
                  Your Academic Doubt Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-red-400"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
            {/* Welcome message */}
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
                  <Sparkles className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">
                    Got a Doubt? I&apos;m Here to Help! 🎯
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">
                    Ask me anything about programming, DSA, math, science, or
                    any academic topic. You can also share a screenshot of your
                    problem!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {[
                    "Explain Binary Search",
                    "What is Big O?",
                    "How does recursion work?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-300 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-br-md"
                      : "bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-bl-md"
                  }`}
                >
                  {/* Image attachment */}
                  {msg.image && (
                    <div className="mb-2 overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.image}
                        alt="Uploaded screenshot"
                        className="max-h-48 w-full rounded-lg object-contain bg-black/30"
                      />
                    </div>
                  )}

                  {/* Text content */}
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none [&_pre]:bg-black/40 [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-indigo-300 [&_code]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#1a1a1a] border border-white/5 px-4 py-3">
                  <span className="ai-typing-dot h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="ai-typing-dot h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="ai-typing-dot h-2 w-2 rounded-full bg-indigo-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {pendingImage && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage}
                alt="Pending upload"
                className="h-14 w-14 rounded-md object-cover"
              />
              <span className="flex-1 truncate text-xs text-gray-400">
                Image attached
              </span>
              <button
                onClick={() => setPendingImage(null)}
                className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-white/5 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-[#141414] p-2 focus-within:border-indigo-500/40 transition-colors">
              {/* Image upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="ai-chat-image-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-indigo-400"
                title="Upload screenshot"
              >
                <ImagePlus className="h-4.5 w-4.5" />
              </button>

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your doubt here..."
                rows={1}
                className="max-h-24 min-h-[2rem] flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                style={{
                  height: "auto",
                  overflowY: input.split("\n").length > 3 ? "auto" : "hidden",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
                }}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !pendingImage)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-600">
              KodeCraft AI · Academic doubts only · Powered by AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}
