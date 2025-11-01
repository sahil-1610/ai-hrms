"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState(null);
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (params.token) {
      fetchTestData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  // Timer countdown
  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, timeRemaining, testCompleted]);

  const fetchTestData = async () => {
    try {
      // Get application by test token
      const appResponse = await fetch(
        `/api/applications?testToken=${params.token}`
      );
      const appData = await appResponse.json();

      if (!appResponse.ok) {
        throw new Error("Invalid test link");
      }

      // Check if test already taken
      if (appData.test_score && appData.test_score > 0) {
        setTestCompleted(true);
        setResults({
          score: appData.test_score,
          passed: appData.test_score >= 60,
        });
        setLoading(false);
        return;
      }

      setApplication(appData);

      // Get test questions
      const testResponse = await fetch(
        `/api/tests/generate?jobId=${appData.job_id}`
      );
      const testData = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error("Test not found");
      }

      setTest(testData);
      setAnswers(new Array(testData.questions.length).fill(null));
      setTimeRemaining(testData.duration_minutes * 60); // Convert to seconds
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error(error.message || "Failed to load test");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    toast.success("Test started! Good luck!");
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredCount = answers.filter((a) => a === null).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testToken: params.token,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit test");
      }

      setResults(data);
      setTestCompleted(true);
      toast.success("Test submitted successfully!");
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error(error.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return answers.filter((a) => a !== null).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Test already completed
  if (testCompleted && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              {results.passed ? (
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              ) : (
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              )}
              <CardTitle className="text-2xl">
                {results.passed ? "Test Completed!" : "Test Completed"}
              </CardTitle>
              <CardDescription>
                {results.passed
                  ? "Congratulations! You've passed the test."
                  : "Thank you for taking the test."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-gray-900">
                  {results.score}%
                </div>
                <p className="text-gray-600">
                  {results.correctAnswers ||
                    results.score /
                      (100 / (test?.questions?.length || 10))}{" "}
                  out of {test?.questions?.length || results.totalQuestions}{" "}
                  questions correct
                </p>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 text-center">
                  Our HR team will review your application and contact you via
                  email regarding the next steps.
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() =>
                    router.push(`/status/${application?.application_token}`)
                  }
                >
                  View Application Status
                </Button>
                <Button variant="outline" onClick={() => router.push("/jobs")}>
                  Browse More Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test not started yet
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Assessment</CardTitle>
              <CardDescription>
                {application?.jobs?.title || "Job Position"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Test Instructions
                    </p>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>
                        {test?.questions?.length || 0} multiple choice questions
                      </li>
                      <li>Duration: {test?.duration_minutes || 30} minutes</li>
                      <li>Passing score: {test?.passing_score || 60}%</li>
                      <li>
                        You can review and change answers before submitting
                      </li>
                      <li>Test will auto-submit when time runs out</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p className="mt-1">
                      Once you start, the timer cannot be paused. Make sure you
                      have a stable internet connection and won&apos;t be
                      interrupted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={startTest} size="lg">
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test in progress
  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with timer and progress */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {application?.jobs?.title || "Technical Assessment"}
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5" />
              <span
                className={
                  timeRemaining < 300 ? "text-red-600" : "text-gray-900"
                }
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            {getAnsweredCount()} of {test.questions.length} questions answered
          </p>
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestion + 1}
            </CardTitle>
            <CardDescription className="text-base text-gray-700 mt-2">
              {question.q}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion]?.toString()}
              onValueChange={(value) =>
                handleAnswerSelect(currentQuestion, parseInt(value))
              }
            >
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestion === test.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Test"
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Question Navigator
          </p>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  w-10 h-10 rounded-md border text-sm font-medium transition-colors
                  ${
                    currentQuestion === index
                      ? "bg-blue-600 text-white border-blue-600"
                      : answers[index] !== null
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
