import { useState, useRef, useCallback } from "react";

interface UseWhisperReturn {
    isRecording: boolean;
    isModelLoading: boolean; // Kept for compatibility, but will be unused or always false
    isTranscribing: boolean;
    transcribedText: string;
    setTranscribedText: (text: string) => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    error: string | null;
}

onRecordingComplete ?: (blob: Blob) => void;
}

export function useWhisper({ onRecordingComplete }: { onRecordingComplete?: (blob: Blob) => void } = {}): UseWhisperReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");

            const response = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setTranscribedText(data.text);
        } catch (err: any) {
            console.error("Transcription error:", err);
            setError(err.message || "Failed to transcribe audio.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const startRecording = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

                // Call the callback if provided (e.g., for uploading)
                if (onRecordingComplete) {
                    onRecordingComplete(audioBlob);
                }

                await transcribeAudio(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Error starting recording:", err);
            setError("Microphone access denied or not available.");
        }
    }, [onRecordingComplete]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    return {
        isRecording,
        isModelLoading: false, // No model loading needed for server-side
        isTranscribing,
        transcribedText,
        setTranscribedText,
        startRecording,
        stopRecording,
        error
    };
}
