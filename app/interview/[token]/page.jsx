"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Loader2,
    Mic,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Send,
    Clock,
    MessageSquare,
} from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";

// Default fallback questions if job doesn't have custom questions configured
const DEFAULT_INTERVIEW_QUESTIONS = [
    { question: "Tell me about yourself and your professional background.", max_duration_seconds: 300, category: "general" },
    { question: "What interests you about this position?", max_duration_seconds: 180, category: "motivation" },
    { question: "Describe a challenging project you worked on and how you handled it.", max_duration_seconds: 300, category: "experience" },
    { question: "What are your greatest strengths and how do they apply to this role?", max_duration_seconds: 180, category: "skills" },
    { question: "Where do you see yourself in 5 years?", max_duration_seconds: 180, category: "career" },
];

export default function InterviewPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [application, setApplication] = useState(null);
    const [job, setJob] = useState(null);
    const [error, setError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [recordings, setRecordings] = useState([]);
    const [currentRecording, setCurrentRecording] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [interviewQuestions, setInterviewQuestions] = useState([]);

    const token = params.token;

    useEffect(() => {
        if (token) {
            fetchApplicationData();
        }
    }, [token]);

    const fetchApplicationData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch application by interview token
            const response = await fetch(`/api/applications?interview_token=${encodeURIComponent(token)}`);
            const data = await response.json();

            if (!response.ok || !data) {
                throw new Error("Invalid interview link. Please check the link and try again.");
            }

            const app = Array.isArray(data) ? data[0] : data;

            if (!app) {
                throw new Error("Interview not found. Please check your invitation email.");
            }

            // Check if interview already completed
            if (app.interview_completed_at) {
                throw new Error("This interview has already been completed. Thank you for your response.");
            }

            setApplication(app);

            // Fetch job details and custom interview questions
            if (app.job_id) {
                const jobResponse = await fetch(`/api/jobs/${app.job_id}`);
                if (jobResponse.ok) {
                    const jobData = await jobResponse.json();
                    setJob(jobData);
                }

                // Fetch custom interview questions for this job
                try {
                    const questionsResponse = await fetch(`/api/jobs/${app.job_id}/interview-questions`);
                    if (questionsResponse.ok) {
                        const questionsData = await questionsResponse.json();
                        if (questionsData.questions && questionsData.questions.length > 0) {
                            setInterviewQuestions(questionsData.questions);
                        } else {
                            // Fallback to default questions
                            setInterviewQuestions(DEFAULT_INTERVIEW_QUESTIONS);
                        }
                    } else {
                        setInterviewQuestions(DEFAULT_INTERVIEW_QUESTIONS);
                    }
                } catch (questionError) {
                    console.error("Error fetching interview questions:", questionError);
                    setInterviewQuestions(DEFAULT_INTERVIEW_QUESTIONS);
                }
            } else {
                setInterviewQuestions(DEFAULT_INTERVIEW_QUESTIONS);
            }
        } catch (err) {
            console.error("Error fetching interview data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordingComplete = (blob) => {
        setCurrentRecording(blob);
    };

    const saveCurrentAnswer = () => {
        if (currentRecording) {
            const newRecordings = [...recordings];
            newRecordings[currentQuestionIndex] = currentRecording;
            setRecordings(newRecordings);
            setCurrentRecording(null);
        }
    };

    const goToNextQuestion = () => {
        saveCurrentAnswer();
        if (currentQuestionIndex < interviewQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPrevQuestion = () => {
        saveCurrentAnswer();
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitInterview = async () => {
        // Save current answer first
        saveCurrentAnswer();

        // Check if at least one question is answered
        const answeredCount = recordings.filter(r => r !== null && r !== undefined).length + (currentRecording ? 1 : 0);
        if (answeredCount === 0) {
            setError("Please record at least one answer before submitting.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Combine all recordings if there are multiple
            const allRecordings = [...recordings];
            if (currentRecording && !allRecordings[currentQuestionIndex]) {
                allRecordings[currentQuestionIndex] = currentRecording;
            }

            // For now, we'll submit the first recording
            // In a full implementation, you might combine all recordings or submit them separately
            const firstRecording = allRecordings.find(r => r !== null && r !== undefined);

            if (!firstRecording) {
                throw new Error("No recordings found. Please record your answers.");
            }

            const formData = new FormData();
            formData.append("audio", firstRecording, "interview-recording.webm");
            formData.append("token", token);
            formData.append("questions", JSON.stringify(interviewQuestions.map(q => q.question)));
            formData.append("answeredQuestions", JSON.stringify(
                allRecordings.map((r, i) => r ? i : null).filter(i => i !== null)
            ));

            const response = await fetch("/api/interview/submit", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit interview");
            }

            setIsComplete(true);
        } catch (err) {
            console.error("Error submitting interview:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading interview...</p>
                </div>
            </div>
        );
    }

    if (error && !application) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Interview Not Available
                        </h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button onClick={() => router.push("/jobs")}>
                            Browse Open Positions
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Interview Submitted!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Thank you for completing your interview. Our team will review your
                            responses and get back to you soon.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push(`/status/${application.application_token}`)}
                                className="w-full"
                            >
                                Track Your Application
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/jobs")}
                                className="w-full"
                            >
                                Browse More Jobs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / interviewQuestions.length) * 100;
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    const hasRecordingForCurrent = recordings[currentQuestionIndex] || currentRecording;
    const maxDuration = currentQuestion?.max_duration_seconds || 300;

    // Don't render until questions are loaded
    if (interviewQuestions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading interview questions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Badge variant="outline" className="mb-2">Interview</Badge>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {job?.title || "Video Interview"}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Hi {application?.name}, please record your answers to the questions below.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>~5 min per question</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
                        <span>{Math.round(progress)}% complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Question Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                {currentQuestionIndex + 1}
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl">{currentQuestion?.question}</CardTitle>
                                <CardDescription className="mt-2">
                                    Take your time to think, then click &quot;Start Recording&quot; when ready.
                                    You have up to {Math.floor(maxDuration / 60)} minutes to answer.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AudioRecorder
                            maxDuration={maxDuration}
                            onRecordingComplete={handleRecordingComplete}
                            disabled={submitting}
                        />

                        {hasRecordingForCurrent && (
                            <div className="mt-4 flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">Answer recorded</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Question Navigation Pills */}
                <div className="flex justify-center gap-2 mb-6">
                    {interviewQuestions.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                saveCurrentAnswer();
                                setCurrentQuestionIndex(index);
                            }}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${index === currentQuestionIndex
                                    ? "bg-blue-600 text-white"
                                    : recordings[index]
                                        ? "bg-green-100 text-green-700 border-2 border-green-500"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={goToPrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    {currentQuestionIndex < interviewQuestions.length - 1 ? (
                        <Button onClick={goToNextQuestion} className="gap-2">
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmitInterview}
                            disabled={submitting}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Interview
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Tips */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Interview Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• Find a quiet place with minimal background noise</li>
                            <li>• Speak clearly and at a natural pace</li>
                            <li>• It&apos;s okay to pause and think before answering</li>
                            <li>• You can re-record each answer as many times as needed</li>
                            <li>• Use specific examples from your experience when possible</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
