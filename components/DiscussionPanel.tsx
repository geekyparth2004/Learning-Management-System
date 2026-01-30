"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Image, Mic, Video, X, Loader2, Play, Pause } from "lucide-react";

interface Message {
    id: string;
    userId: string;
    content: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

interface DiscussionPanelProps {
    onClose: () => void;
}

export default function DiscussionPanel({ onClose }: DiscussionPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Fetch messages on mount and poll every 5 seconds
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/discussion/messages");
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (content?: string, mediaUrl?: string, mediaType?: string) => {
        if (!content && !mediaUrl) return;

        setIsSending(true);
        try {
            const res = await fetch("/api/discussion/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, mediaUrl, mediaType })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.message]);
                setNewMessage("");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
        }
    };

    const handleFileUpload = async (file: File, mediaType: "image" | "video") => {
        setIsUploading(true);
        try {
            // Get presigned URL
            const res = await fetch("/api/discussion/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    mediaType
                })
            });

            if (!res.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, publicUrl } = await res.json();

            // Upload file directly
            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type }
            });

            // Send message with media
            await sendMessage(undefined, publicUrl, mediaType);
        } catch (error) {
            console.error("Error uploading file:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith("image/")) {
                handleFileUpload(file, "image");
            } else if (file.type.startsWith("video/")) {
                handleFileUpload(file, "video");
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });

                // Upload voice message
                setIsUploading(true);
                try {
                    const res = await fetch("/api/discussion/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            filename: file.name,
                            contentType: file.type,
                            mediaType: "voice"
                        })
                    });

                    if (res.ok) {
                        const { uploadUrl, publicUrl } = await res.json();
                        await fetch(uploadUrl, {
                            method: "PUT",
                            body: file,
                            headers: { "Content-Type": file.type }
                        });
                        await sendMessage(undefined, publicUrl, "voice");
                    }
                } catch (error) {
                    console.error("Error uploading voice:", error);
                } finally {
                    setIsUploading(false);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                <h2 className="text-lg font-bold text-white">💬 Discussion</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>No messages yet. Start the discussion!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {msg.user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-white text-sm">{msg.user.name || "Anonymous"}</span>
                                    <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                                </div>
                                {msg.content && (
                                    <p className="text-gray-300 text-sm mt-1 break-words">{msg.content}</p>
                                )}
                                {msg.mediaUrl && msg.mediaType === "image" && (
                                    <img
                                        src={msg.mediaUrl}
                                        alt="Shared image"
                                        className="mt-2 max-w-full rounded-lg max-h-48 object-cover"
                                    />
                                )}
                                {msg.mediaUrl && msg.mediaType === "voice" && (
                                    <audio
                                        src={msg.mediaUrl}
                                        controls
                                        className="mt-2 w-full max-w-[200px] h-8"
                                    />
                                )}
                                {msg.mediaUrl && msg.mediaType === "video" && (
                                    <video
                                        src={msg.mediaUrl}
                                        controls
                                        className="mt-2 max-w-full rounded-lg max-h-48"
                                    />
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={handleImageSelect}
                        disabled={isUploading}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                        title="Attach image/video"
                    >
                        <Image className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isUploading}
                        className={`p-2 transition-colors ${isRecording ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-green-400"} disabled:opacity-50`}
                        title={isRecording ? "Stop recording" : "Record voice"}
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        disabled={isSending || isUploading}
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending || isUploading}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>

                {isUploading && (
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading...
                    </div>
                )}
            </div>
        </div>
    );
}
