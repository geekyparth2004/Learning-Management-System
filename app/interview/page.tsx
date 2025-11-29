"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, Users, BookOpen, Code2, Database, ArrowLeft, Trophy } from "lucide-react";

const categories = [
    {
        id: "project",
        title: "Project & Internship",
        description: "Discuss your projects and internship experiences. Perfect for showcasing your practical skills.",
        icon: Briefcase,
        color: "text-blue-400",
        bgColor: "bg-blue-900/20",
        borderColor: "hover:border-blue-500",
    },
    {
        id: "behavioural",
        title: "Behavioural",
        description: "Prepare for HR rounds with common behavioural questions like 'Tell me about a time...'",
        icon: Users,
        color: "text-purple-400",
        bgColor: "bg-purple-900/20",
        borderColor: "hover:border-purple-500",
    },
    {
        id: "core",
        title: "Core Subject",
        description: "Deep dive into OS, DBMS, CN, and other core computer science subjects.",
        icon: BookOpen,
        color: "text-green-400",
        bgColor: "bg-green-900/20",
        borderColor: "hover:border-green-500",
    },
    {
        id: "dsa",
        title: "DSA Question",
        description: "Technical interview practice with Data Structures and Algorithms problems.",
        icon: Code2,
        color: "text-orange-400",
        bgColor: "bg-orange-900/20",
        borderColor: "hover:border-orange-500",
    },
    {
        id: "sql",
        title: "SQL Interview",
        description: "Test your database knowledge with SQL queries and design questions.",
        icon: Database,
        color: "text-pink-400",
        bgColor: "bg-pink-900/20",
        borderColor: "hover:border-pink-500",
    },
    {
        id: "mock",
        title: "Full Mock Interview",
        description: "The ultimate test. 25 questions covering Intro, Project, Technical, and HR rounds.",
        icon: Trophy,
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/20",
        borderColor: "hover:border-yellow-500",
    },
];

export default function InterviewPage() {
    return (
        <div className="min-h-screen bg-[#0e0e0e] p-8 text-white">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/"
                        className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="mb-4 text-4xl font-bold">AI Interview Practice</h1>
                    <p className="max-w-2xl text-lg text-gray-400">
                        Master your interview skills with our AI-powered interviewer. Choose a category to get started.
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/interview/${category.id}`}
                            className={`group relative overflow-hidden rounded-xl border border-gray-800 bg-[#161616] p-6 transition-all ${category.borderColor} hover:shadow-lg`}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className={`rounded-full p-3 transition-colors ${category.bgColor} ${category.color}`}>
                                    <category.icon className="h-6 w-6" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-white">
                                {category.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {category.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
