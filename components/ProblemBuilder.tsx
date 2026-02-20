import React, { useState } from "react";
import { X, Plus, Trash2, Video, Upload, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}


interface HintItem {
    type: "text" | "video";
    content: string; // Text content or Video URL
    videoFile?: File | null;
}

interface ProblemData {
    title: string;
    description: string;
    testCases: TestCase[];
    hints: any[]; // Changed to allow object array
    videoSolution?: string;
    type: "CODING" | "WEB_DEV" | "LEETCODE" | "MCQ";
    webDevInstructions?: string;
    webDevInitialCode?: {
        html: string;
        css: string;
        js: string;
    };
    leetcodeUrl?: string;
    isManualVerification?: boolean;
    mcqOptions?: string[];
    mcqCorrectAnswer?: string;
}

interface ProblemBuilderProps {
    onSave: (problem: ProblemData) => void;
    onCancel: () => void;
    uploadVideo: (file: File) => Promise<string>;
    initialData?: any; // New prop for editing
    isUploading?: boolean;
}

export default function ProblemBuilder({ onSave, onCancel, uploadVideo, isUploading, initialData }: ProblemBuilderProps) {
    const [activeTab, setActiveTab] = useState<"details" | "hints">("details");

    // Form State (Initialize with initialData if present)
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [testCases, setTestCases] = useState<TestCase[]>(
        initialData?.testCases
            ? (typeof initialData.testCases === 'string' ? JSON.parse(initialData.testCases) : initialData.testCases)
            : [{ input: "", expectedOutput: "", isHidden: false }]
    );
    const [hints, setHints] = useState<HintItem[]>(
        initialData?.hints
            ? (typeof initialData.hints === 'string' ? JSON.parse(initialData.hints) : initialData.hints).map((h: any) => ({
                type: h.type,
                content: h.content
            }))
            : []
    );
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState(initialData?.videoSolution || "");
    const [problemType, setProblemType] = useState<"CODING" | "WEB_DEV" | "LEETCODE" | "MCQ">(initialData?.type || "CODING");
    const [isManualVerification, setIsManualVerification] = useState(initialData?.isManualVerification || false);

    // MCQ State
    const [mcqOptions, setMcqOptions] = useState<string[]>(
        initialData?.mcqOptions
            ? (typeof initialData.mcqOptions === 'string' ? JSON.parse(initialData.mcqOptions) : initialData.mcqOptions)
            : ["", ""]
    );
    const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState<string>(initialData?.mcqCorrectAnswer || "");

    // Web Dev State
    const [webDevInstructions, setWebDevInstructions] = useState(initialData?.webDevInstructions || "");
    const [webDevHtml, setWebDevHtml] = useState(initialData?.webDevInitialCode?.html || "");
    const [webDevCss, setWebDevCss] = useState(initialData?.webDevInitialCode?.css || "");
    const [webDevJs, setWebDevJs] = useState(initialData?.webDevInitialCode?.js || "");

    const [uploadingState, setUploadingState] = useState(false);

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
    };

    const handleRemoveTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleTestCaseChange = (index: number, field: keyof TestCase, value: string) => {
        const newTestCases = [...testCases];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setTestCases(newTestCases);
    };

    const handleAddHint = () => {
        if (hints.length < 5) { // Increased limit slightly or keep 4 but flexible
            setHints([...hints, { type: "text", content: "" }]);
        }
    };

    const handleRemoveHint = (index: number) => {
        setHints(hints.filter((_, i) => i !== index));
    };

    const handleHintChange = (index: number, field: keyof HintItem, value: any) => {
        const newHints = [...hints];
        newHints[index] = { ...newHints[index], [field]: value };
        setHints(newHints);
    };

    const handleAddMcqOption = () => setMcqOptions([...mcqOptions, ""]);

    const handleRemoveMcqOption = (index: number) => {
        const removedOption = mcqOptions[index];
        setMcqOptions(mcqOptions.filter((_, i) => i !== index));
        if (mcqCorrectAnswer === removedOption) {
            setMcqCorrectAnswer("");
        }
    };

    const handleMcqOptionChange = (index: number, value: string) => {
        const newOptions = [...mcqOptions];
        const oldOption = newOptions[index];
        newOptions[index] = value;
        setMcqOptions(newOptions);
        if (mcqCorrectAnswer === oldOption) {
            setMcqCorrectAnswer(value);
        }
    };

    const handleSave = async () => {
        if (!title) {
            alert("Title is required");
            return;
        }

        if (problemType === "CODING" && !description) {
            alert("Description is required for coding problems");
            return;
        }

        if (problemType === "WEB_DEV" && !webDevInstructions) {
            alert("Instructions are required for web dev problems");
            return;
        }

        setUploadingState(true);

        try {
            // Upload main solution video if any (User might still use this for LeetCode)
            let finalVideoUrl = videoUrl;
            if (videoFile) {
                try {
                    finalVideoUrl = await uploadVideo(videoFile);
                } catch (error: any) {
                    console.error("Video upload failed", error);
                    alert(`Failed to upload video: ${error.message}`);
                    setUploadingState(false);
                    return;
                }
            }

            // Upload Hint Videos
            const processedHints = await Promise.all(hints.map(async (hint) => {
                if (hint.type === "video" && hint.videoFile) {
                    try {
                        const url = await uploadVideo(hint.videoFile);
                        return { type: "video", content: url };
                    } catch (error: any) {
                        throw new Error(`Failed to upload hint video: ${error.message}`);
                    }
                }
                return { type: hint.type, content: hint.content };
            }));

            onSave({
                title,
                description: problemType === "CODING" ? description : problemType === "WEB_DEV" ? webDevInstructions : "",
                testCases: problemType === "CODING" ? testCases : [],
                hints: processedHints,
                videoSolution: finalVideoUrl || undefined,
                type: problemType,
                leetcodeUrl: problemType === "LEETCODE" ? description : undefined,
                isManualVerification: problemType === "LEETCODE" ? isManualVerification : undefined,
                webDevInstructions: problemType === "WEB_DEV" ? webDevInstructions : undefined,
                webDevInitialCode: problemType === "WEB_DEV" ? {
                    html: webDevHtml,
                    css: webDevCss,
                    js: webDevJs
                } : undefined,
                mcqOptions: problemType === "MCQ" ? mcqOptions : undefined,
                mcqCorrectAnswer: problemType === "MCQ" ? mcqCorrectAnswer : undefined
            });
        } catch (e: any) {
            alert(e.message);
        } finally {
            setUploadingState(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 1. Get presigned URL
            const res = await fetch("/api/upload/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, contentType: file.type }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // 2. Upload to S3/R2
            const uploadRes = await fetch(data.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });
            if (!uploadRes.ok) throw new Error("Failed to upload image to storage");

            // 3. Append Markdown to description
            const imageUrl = data.publicUrl;
            const markdownImage = `![${file.name}](${imageUrl})`;

            if (problemType === "CODING" || problemType === "LEETCODE") {
                setDescription((prev: string) => prev + "\n" + markdownImage + "\n");
            } else if (problemType === "WEB_DEV") {
                setWebDevInstructions((prev: string) => prev + "\n" + markdownImage + "\n");
            }

        } catch (error) {
            console.error("Image upload failed:", error);
            alert("Failed to upload image");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#0e0e0e] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Create New Problem</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-[#111111] px-6">
                    <button
                        onClick={() => setActiveTab("details")}
                        className={cn(
                            "border-b-2 px-6 py-3 text-sm font-medium transition-colors",
                            activeTab === "details"
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-gray-400 hover:text-white"
                        )}
                    >
                        Problem Details
                    </button>
                    <button
                        onClick={() => setActiveTab("hints")}
                        className={cn(
                            "border-b-2 px-6 py-3 text-sm font-medium transition-colors",
                            activeTab === "hints"
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-gray-400 hover:text-white"
                        )}
                    >
                        Hints (Optional)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">Problem Type:</label>
                        <select
                            value={problemType}
                            onChange={(e) => setProblemType(e.target.value as "CODING" | "WEB_DEV" | "LEETCODE" | "MCQ")}
                            className="rounded bg-[#111111] border border-gray-700 px-3 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="CODING">Coding Problem</option>
                            <option value="WEB_DEV">Web Development</option>
                            <option value="LEETCODE">LeetCode/External Problem</option>
                            <option value="MCQ">Multiple Choice Question</option>
                        </select>
                    </div>

                    {activeTab === "details" ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Problem Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Sum of Two Numbers"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {problemType === "LEETCODE" ? (
                                <div className="space-y-6">
                                    <div className="rounded border border-gray-700 bg-[#1e1e1e] p-4">
                                        <label className="text-sm font-medium text-gray-300">Solution Video (Optional)</label>
                                        <div className="mt-2 flex items-center gap-4 rounded border border-gray-700 bg-[#111111] p-3">
                                            <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                                                <Upload size={16} />
                                                Choose file
                                                <input
                                                    type="file"
                                                    accept="video/*,.mkv,video/x-matroska"
                                                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                            </label>
                                            <span className="text-sm text-gray-400">
                                                {videoFile ? videoFile.name : "No file chosen"}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Upload a video solution. It will be unlocked for students 20 minutes after they start the problem.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">External Problem URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://leetcode.com/... or https://geeksforgeeks.org/..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Paste the full URL. Students will be redirected there.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 rounded border border-gray-700 bg-[#111111] p-3">
                                        <input
                                            type="checkbox"
                                            id="manualVerify"
                                            checked={isManualVerification}
                                            onChange={(e) => setIsManualVerification(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="manualVerify" className="text-sm text-gray-300 select-none cursor-pointer">
                                            This is not a LeetCode problem (Manual Verification)
                                            <span className="block text-xs text-gray-500">
                                                Enable this for GeeksForGeeks, InterviewBit, etc. Students will mark it as complete manually.
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ) : problemType === "CODING" ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-300">Problem Description</label>
                                            <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors">
                                                <Upload size={14} />
                                                Add Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <textarea
                                            placeholder="Describe the problem statement, input format, output format, and constraints..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
                                        />
                                    </div>



                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white">Test Cases</h3>
                                            <button
                                                onClick={handleAddTestCase}
                                                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1e1e1e] px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                                            >
                                                <Plus size={16} /> Add Test Case
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {testCases.map((tc, idx) => (
                                                <div key={idx} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-400">Test Case {idx + 1}</span>
                                                        {testCases.length > 1 && (
                                                            <button
                                                                onClick={() => handleRemoveTestCase(idx)}
                                                                className="text-gray-500 hover:text-red-400"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-500">Input</label>
                                                            <textarea
                                                                value={tc.input}
                                                                onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
                                                                className="h-20 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                                placeholder="Test case input"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-500">Expected Output</label>
                                                            <textarea
                                                                value={tc.expectedOutput}
                                                                onChange={(e) => handleTestCaseChange(idx, "expectedOutput", e.target.value)}
                                                                className="h-20 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                                placeholder="Expected output"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : problemType === "WEB_DEV" ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-300">Instructions</label>
                                            <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors">
                                                <Upload size={14} />
                                                Add Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <textarea
                                            placeholder="Enter assignment instructions..."
                                            value={webDevInstructions}
                                            onChange={(e) => setWebDevInstructions(e.target.value)}
                                            className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Initial HTML</label>
                                            <textarea
                                                value={webDevHtml}
                                                onChange={(e) => setWebDevHtml(e.target.value)}
                                                className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Initial CSS</label>
                                            <textarea
                                                value={webDevCss}
                                                onChange={(e) => setWebDevCss(e.target.value)}
                                                className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Initial JS</label>
                                            <textarea
                                                value={webDevJs}
                                                onChange={(e) => setWebDevJs(e.target.value)}
                                                className="h-40 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-300">Question Text</label>
                                            <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors">
                                                <Upload size={14} />
                                                Add Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <textarea
                                            placeholder="Enter the multiple choice question..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="h-32 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white">Options</h3>
                                            <button
                                                onClick={handleAddMcqOption}
                                                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1e1e1e] px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                                            >
                                                <Plus size={16} /> Add Option
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {mcqOptions.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#161616] p-3">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={mcqCorrectAnswer === opt && opt !== ""}
                                                        onChange={() => setMcqCorrectAnswer(opt)}
                                                        className="h-4 w-4 border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                                        title="Mark as correct answer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => handleMcqOptionChange(idx, e.target.value)}
                                                        className="flex-1 rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                        placeholder={`Option ${idx + 1}`}
                                                    />
                                                    {mcqOptions.length > 2 && (
                                                        <button
                                                            onClick={() => handleRemoveMcqOption(idx)}
                                                            className="text-gray-500 hover:text-red-400"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {mcqCorrectAnswer && !mcqOptions.includes(mcqCorrectAnswer) && (
                                            <p className="text-sm text-red-400 mt-2">Please select a valid correct answer.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Hints</h3>
                                <button
                                    onClick={handleAddHint}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <Plus size={16} /> Add Hint
                                </button>
                            </div>

                            {hints.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-800 bg-[#111111] text-center">
                                    <p className="text-gray-400">No hints added. Click "Add Hint" to create one.</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-yellow-500">
                                        <AlertCircle size={14} />
                                        <span>Hints unlock progressively: each hint becomes available 5 minutes after the previous one.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {hints.map((hint, idx) => (
                                        <div key={idx} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-semibold text-white">Hint {idx + 1}</span>
                                                    <div className="flex bg-[#111111] rounded p-0.5 border border-gray-700">
                                                        <button
                                                            onClick={() => handleHintChange(idx, "type", "text")}
                                                            className={cn("px-2 py-0.5 text-xs rounded transition-colors", hint.type === "text" ? "bg-gray-700 text-white" : "text-gray-400")}
                                                        >
                                                            Text
                                                        </button>
                                                        <button
                                                            onClick={() => handleHintChange(idx, "type", "video")}
                                                            className={cn("px-2 py-0.5 text-xs rounded transition-colors", hint.type === "video" ? "bg-gray-700 text-white" : "text-gray-400")}
                                                        >
                                                            Video
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveHint(idx)}
                                                    className="text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {hint.type === "text" ? (
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Hint Text</label>
                                                        <textarea
                                                            value={hint.content}
                                                            onChange={(e) => handleHintChange(idx, "content", e.target.value)}
                                                            className="h-24 w-full rounded border border-gray-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                            placeholder="Enter hint text"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Video File</label>
                                                        <div className="flex items-center gap-4 rounded border border-gray-700 bg-[#1e1e1e] p-3">
                                                            <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                                                                <Upload size={16} />
                                                                Choose Video
                                                                <input
                                                                    type="file"
                                                                    accept="video/*,.mkv,video/x-matroska"
                                                                    onChange={(e) => handleHintChange(idx, "videoFile", e.target.files?.[0] || null)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                            <span className="text-sm text-gray-400 truncate max-w-[200px]">
                                                                {hint.videoFile ? hint.videoFile.name : (hint.content ? "Existing Video" : "No file chosen")}
                                                            </span>
                                                        </div>
                                                        {hint.content && !hint.videoFile && (
                                                            <p className="text-xs text-green-400 mt-1">Video currently set.</p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock size={12} />
                                                    <span>
                                                        Unlocks after {(idx + 1) * 2} minutes
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-800 bg-[#161616] px-6 py-4">
                    <button
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isUploading || uploadingState}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isUploading || uploadingState ? "Uploading..." : "Save Problem"}
                    </button>
                </div>
            </div>
        </div>
    );
}
