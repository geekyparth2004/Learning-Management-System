
import { useState, useEffect, useRef, useCallback } from 'react';

export function useWhisper() {
    const [isRecording, setIsRecording] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [transcribedText, setTranscribedText] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const worker = useRef<Worker | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioContext = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../app/worker.js', import.meta.url), {
                type: 'module',
            });

            worker.current.onmessage = (event) => {
                const { type, data } = event.data;
                if (type === 'download') {
                    // Model downloading progress
                    if (data.status === 'ready') {
                        setIsModelLoading(false);
                    }
                } else if (type === 'complete') {
                    setTranscribedText(prev => {
                        const newText = data.text.trim();
                        return prev ? `${prev} ${newText}` : newText;
                    });
                    setIsTranscribing(false);
                } else if (type === 'error') {
                    console.error('Whisper error:', data);
                    setError(data);
                    setIsTranscribing(false);
                    setIsModelLoading(false); // Ensure we don't get stuck in loading
                }
            };

            // Trigger model loading immediately
            worker.current.postMessage({ type: 'load' });
        }

        return () => {
            worker.current?.terminate();
        };
    }, []);

    const startRecording = useCallback(async () => {
        setError(null); // Clear previous errors
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioContext.current = new AudioContext({ sampleRate: 16000 });

            let chunks: Blob[] = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                chunks = [];

                if (worker.current) {
                    setIsTranscribing(true);
                    try {
                        const arrayBuffer = await blob.arrayBuffer();
                        const audioData = await decodeAudioData(arrayBuffer);
                        worker.current.postMessage({
                            type: 'transcribe',
                            audio: audioData,
                        });
                    } catch (err) {
                        console.error("Audio decoding error:", err);
                        setError("Failed to process audio. Please try again.");
                        setIsTranscribing(false);
                    }
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setError("Could not access microphone.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // Helper to decode audio data to float32 for Whisper
    const decodeAudioData = async (arrayBuffer: ArrayBuffer) => {
        if (!audioContext.current) return new Float32Array(0);
        const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
        return audioBuffer.getChannelData(0);
    };

    return {
        isRecording,
        isModelLoading,
        isTranscribing,
        transcribedText,
        setTranscribedText,
        startRecording,
        stopRecording,
        error,
    };
}
