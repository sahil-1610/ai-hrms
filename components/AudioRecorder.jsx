"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Pause, Play, Loader2, AlertCircle } from "lucide-react";

export default function AudioRecorder({
    maxDuration = 300, // 5 minutes default
    onRecordingComplete,
    disabled = false
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    // Check for microphone permission
    useEffect(() => {
        checkPermission();
        return () => {
            cleanup();
        };
    }, []);

    const checkPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionGranted(true);
        } catch (err) {
            console.error("Microphone permission error:", err);
            setPermissionGranted(false);
            setError("Microphone access denied. Please allow microphone access to record.");
        }
    };

    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            setError(null);
            setAudioBlob(null);
            setAudioUrl(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType;
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setIsPaused(false);
            setElapsedTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= maxDuration) {
                        stopRecording();
                    }
                    return newTime;
                });
            }, 1000);

        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Failed to start recording. Please check microphone permissions.");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                timerRef.current = setInterval(() => {
                    setElapsedTime(prev => {
                        const newTime = prev + 1;
                        if (newTime >= maxDuration) {
                            stopRecording();
                        }
                        return newTime;
                    });
                }, 1000);
            } else {
                mediaRecorderRef.current.pause();
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            }
            setIsPaused(!isPaused);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const resetRecording = () => {
        cleanup();
        setAudioBlob(null);
        setAudioUrl(null);
        setElapsedTime(0);
        setError(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (elapsedTime / maxDuration) * 100;

    if (permissionGranted === null) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Checking microphone access...</span>
            </div>
        );
    }

    if (permissionGranted === false) {
        return (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Timer Display */}
            <div className="text-center">
                <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                    {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                    Max: {formatTime(maxDuration)}
                </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />

            {/* Recording Indicator */}
            {isRecording && (
                <div className="flex items-center justify-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-sm font-medium">
                        {isPaused ? 'Paused' : 'Recording...'}
                    </span>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                {!isRecording && !audioBlob && (
                    <Button
                        onClick={startRecording}
                        disabled={disabled}
                        size="lg"
                        className="gap-2"
                    >
                        <Mic className="h-5 w-5" />
                        Start Recording
                    </Button>
                )}

                {isRecording && (
                    <>
                        <Button
                            onClick={pauseRecording}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                        >
                            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                            {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                        <Button
                            onClick={stopRecording}
                            variant="destructive"
                            size="lg"
                            className="gap-2"
                        >
                            <Square className="h-5 w-5" />
                            Stop
                        </Button>
                    </>
                )}

                {audioBlob && !isRecording && (
                    <Button
                        onClick={resetRecording}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                    >
                        <Mic className="h-5 w-5" />
                        Record Again
                    </Button>
                )}
            </div>

            {/* Audio Preview */}
            {audioUrl && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preview your recording:
                    </p>
                    <audio
                        src={audioUrl}
                        controls
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Duration: {formatTime(elapsedTime)} |
                        Size: {(audioBlob.size / 1024).toFixed(2)} KB
                    </p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
}
