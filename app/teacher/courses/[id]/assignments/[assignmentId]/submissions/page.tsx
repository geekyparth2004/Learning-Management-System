"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Clock, Code } from "lucide-react";
import Link from "next/link";
import CodeEditor from "@/components/CodeEditor";

interface Submission {
    id: string;
    code: string;
    language: string;
    status: "ACCEPTED" | "WRONG_ANSWER";
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface Problem {
    id: string;
    title: string;
    submissions: Submission[];
}

interface Assignment {
    id: string;
    title: string;
    problems: Problem[];
}

export default function AssignmentSubmissionsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await fetch(`/api/assignments/${assignmentId}/submissions`);
                if (res.ok) {
                    const data = await res.json();
                    setAssignment(data);
                    // Select first submission if available
                    if (data.problems?.[0]?.submissions?.length > 0) {
                        setSelectedSubmission(data.problems[0].submissions[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch submissions", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [assignmentId]);

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;
    if (!assignment) return <div className="p-8 text-white">Assignment not found</div>;

    // Flatten submissions from all problems (currently assuming 1 problem per assignment usually)
    const allSubmissions = assignment.problems.flatMap(p =>
        p.submissions.map(s => ({ ...s, problemTitle: p.title }))
    );

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white">
            <header className="border-b border-gray-800 bg-[#161616] px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href={`/teacher/courses/${courseId}/builder`} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{assignment.title}</h1>
                        <p className="text-sm text-gray-400">Submissions</p>
                    </div>
                </div>
            </header>

            <main className="flex h-[calc(100vh-73px)]">
                {/* Sidebar List */}
                <div className="w-80 border-r border-gray-800 bg-[#111111] overflow-y-auto">
                    <div className="p-4">
                        <h2 className="mb-4 font-semibold text-gray-400">Students ({allSubmissions.length})</h2>
                        <div className="space-y-2">
                            {allSubmissions.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    className={`w-full rounded p-3 text-left transition-colors ${selectedSubmission?.id === sub.id
                                            ? "bg-blue-900/30 border border-blue-900"
                                            : "bg-[#1e1e1e] border border-gray-800 hover:border-gray-600"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{sub.user.name || sub.user.email}</span>
                                        {sub.status === "ACCEPTED" ? (
                                            <CheckCircle size={14} className="text-green-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                                        <span className="uppercase">{sub.language}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-[#0e0e0e]">
                    {selectedSubmission ? (
                        <>
                            <div className="border-b border-gray-800 bg-[#161616] px-6 py-3 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{selectedSubmission.user.name}</h3>
                                    <p className="text-xs text-gray-400">{selectedSubmission.user.email}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${selectedSubmission.status === "ACCEPTED"
                                            ? "bg-green-900/30 text-green-400"
                                            : "bg-red-900/30 text-red-400"
                                        }`}>
                                        {selectedSubmission.status === "ACCEPTED" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        {selectedSubmission.status}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={14} />
                                        {new Date(selectedSubmission.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <CodeEditor
                                    code={selectedSubmission.code}
                                    language={selectedSubmission.language as any}
                                    onChange={() => { }} // Read-only
                                    readOnly={true}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Code size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Select a submission to view code</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
