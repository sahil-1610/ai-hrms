"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import CandidateNotes from "@/components/CandidateNotes";
import ScorecardDisplay from "@/components/ScorecardDisplay";
import InterviewScorecardModal from "@/components/InterviewScorecardModal";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardList,
  Mic,
  ExternalLink,
  Calendar,
  Video,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Clock,
  Award,
  Sparkles,
  StickyNote,
} from "lucide-react";

// Pipeline stage definitions
const PIPELINE_STAGES = [
  { key: "resume_screening", label: "Resume Screening", shortLabel: "Resume", icon: FileText },
  { key: "mcq_test", label: "MCQ Test", shortLabel: "MCQ", icon: ClipboardList },
  { key: "async_interview", label: "Async Interview", shortLabel: "Async", icon: Mic },
  { key: "live_interview", label: "Live Interview", shortLabel: "Live", icon: Video },
  { key: "offer", label: "Offer", shortLabel: "Offer", icon: Star },
];

// Pipeline Stage Indicator Component
function PipelineStageIndicator({ currentStage }) {
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStage);

  if (currentStage === "hired") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {PIPELINE_STAGES.map((_, idx) => (
            <div key={idx} className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <div className="w-8 h-1 bg-green-500" />
              )}
            </div>
          ))}
        </div>
        <Badge className="bg-green-500 text-white ml-4">Hired</Badge>
      </div>
    );
  }

  if (currentStage === "rejected") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Rejected</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = idx < stageIndex;
        const isCurrent = idx === stageIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.key} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
              }`}
              title={stage.label}
            >
              <Icon className="w-5 h-5" />
            </div>
            {idx < PIPELINE_STAGES.length - 1 && (
              <div
                className={`w-12 h-1 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            )}
          </div>
        );
      })}
      {stageIndex >= 0 && (
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-4">
          {PIPELINE_STAGES[stageIndex]?.label || currentStage}
        </span>
      )}
    </div>
  );
}

// Audio Player Component
function AudioPlayer({ audioUrl }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percentage * duration;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          className="h-12 w-12 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        <div className="flex-1">
          <div
            className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <Volume2 className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancingStage, setAdvancingStage] = useState(false);
  const [rejectingCandidate, setRejectingCandidate] = useState(false);
  const [sendingTestInvite, setSendingTestInvite] = useState(false);
  const [sendingInterviewInvite, setSendingInterviewInvite] = useState(false);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  useEffect(() => {
    if (session && session.user.role !== "hr" && session.user.role !== "admin") {
      router.push("/");
      return;
    }

    if (params.id) {
      fetchCandidate();
    }
  }, [session, params.id]);

  const fetchCandidate = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch candidate");
      }

      setCandidate(data);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      toast.error("Failed to load candidate details");
      router.push("/admin/candidates");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 60) return "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400";
  };

  const getNextStageLabel = (currentStage) => {
    const stages = ["resume_screening", "mcq_test", "async_interview", "live_interview", "offer"];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      return PIPELINE_STAGES.find((s) => s.key === nextStage)?.label || nextStage;
    }
    return null;
  };

  const handleAdvanceStage = async (targetStage = null) => {
    setAdvancingStage(true);
    try {
      const response = await fetch(`/api/applications/${candidate.id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to advance candidate");
      }

      setCandidate((prev) => ({
        ...prev,
        current_stage: data.newStage,
        status: data.application.status,
      }));

      toast.success(`Candidate advanced to ${data.newStage.replace("_", " ")}`);
    } catch (error) {
      console.error("Error advancing candidate:", error);
      toast.error(error.message || "Failed to advance candidate");
    } finally {
      setAdvancingStage(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this candidate?")) {
      return;
    }

    setRejectingCandidate(true);
    try {
      const response = await fetch(`/api/applications/${candidate.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject candidate");
      }

      setCandidate((prev) => ({
        ...prev,
        status: "rejected",
        current_stage: "rejected",
      }));

      toast.success("Candidate rejected");
    } catch (error) {
      console.error("Error rejecting candidate:", error);
      toast.error("Failed to reject candidate");
    } finally {
      setRejectingCandidate(false);
    }
  };

  const handleHire = async () => {
    if (!window.confirm("Are you sure you want to hire this candidate?")) {
      return;
    }

    setAdvancingStage(true);
    try {
      const response = await fetch(`/api/applications/${candidate.id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStage: "hired" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to hire candidate");
      }

      setCandidate((prev) => ({
        ...prev,
        current_stage: "hired",
        status: "hired",
      }));

      toast.success("Candidate hired!");
    } catch (error) {
      console.error("Error hiring candidate:", error);
      toast.error(error.message || "Failed to hire candidate");
    } finally {
      setAdvancingStage(false);
    }
  };

  const handleSendTestInvite = async () => {
    setSendingTestInvite(true);
    try {
      const response = await fetch("/api/tests/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: candidate.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test invite");
      }

      setCandidate((prev) => ({
        ...prev,
        test_token: data.testToken,
      }));

      toast.success("MCQ Test invitation sent successfully!");
    } catch (error) {
      console.error("Error sending test invite:", error);
      toast.error(error.message || "Failed to send test invite");
    } finally {
      setSendingTestInvite(false);
    }
  };

  const handleSendInterviewInvite = async () => {
    setSendingInterviewInvite(true);
    try {
      const response = await fetch("/api/interview/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: candidate.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send interview invite");
      }

      setCandidate((prev) => ({
        ...prev,
        interview_token: data.interviewToken,
      }));

      toast.success("Async Interview invitation sent successfully!");
    } catch (error) {
      console.error("Error sending interview invite:", error);
      toast.error(error.message || "Failed to send interview invite");
    } finally {
      setSendingInterviewInvite(false);
    }
  };

  const handleAnalyzeResume = async () => {
    setAnalyzingResume(true);
    try {
      const response = await fetch(`/api/applications/${candidate.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      // Update candidate with new analysis data
      setCandidate((prev) => ({
        ...prev,
        resume_text: data.application.resume_text,
        resume_match_score: data.analysis.matchScore,
        overall_score: data.analysis.matchScore,
        ai_match_data: data.application.ai_match_data,
      }));

      toast.success(`Resume analyzed! Match score: ${Math.round(data.analysis.matchScore)}%`);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast.error(error.message || "Failed to analyze resume");
    } finally {
      setAnalyzingResume(false);
    }
  };

  // Parse AI evaluation
  const getEvaluation = () => {
    if (!candidate?.ai_evaluation) return null;
    try {
      return typeof candidate.ai_evaluation === "string"
        ? JSON.parse(candidate.ai_evaluation)
        : candidate.ai_evaluation;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  const evaluation = getEvaluation();
  const nextStage = getNextStageLabel(candidate.current_stage || "resume_screening");
  const canAdvance =
    candidate.current_stage !== "hired" &&
    candidate.current_stage !== "rejected" &&
    nextStage;
  const isAtOffer = candidate.current_stage === "offer";

  // Determine stage statuses
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === candidate.current_stage);
  const hasTestToken = !!candidate.test_token;
  // Check if test was actually taken (score > 0 means test was completed, since 0 is the default)
  const hasTestScore = candidate.test_score !== null && candidate.test_score !== undefined && candidate.test_score > 0;
  const hasInterviewToken = !!candidate.interview_token;
  const hasInterviewCompleted = !!candidate.interview_completed_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/candidates">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {candidate.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Applied for: {candidate.jobs?.title || "Unknown Job"}
            </p>
          </div>
        </div>
        <div
          className={`text-4xl font-bold px-6 py-3 rounded-xl ${getScoreColor(
            candidate.overall_score || candidate.resume_match_score || 0
          )}`}
        >
          {Math.round(candidate.overall_score || candidate.resume_match_score || 0)}%
          <span className="block text-sm font-normal">Overall Score</span>
        </div>
      </div>

      {/* Pipeline Progress Card */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-gray-100">Pipeline Progress</CardTitle>
            <div className="flex gap-2">
              {isAtOffer && (
                <Button
                  onClick={handleHire}
                  disabled={advancingStage}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {advancingStage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Hire Candidate
                </Button>
              )}
              {canAdvance && !isAtOffer && (
                <Button onClick={() => handleAdvanceStage()} disabled={advancingStage}>
                  {advancingStage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Advance to {nextStage}
                </Button>
              )}
              {candidate.current_stage !== "rejected" && candidate.current_stage !== "hired" && (
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectingCandidate}
                >
                  {rejectingCandidate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PipelineStageIndicator currentStage={candidate.current_stage || "resume_screening"} />
        </CardContent>
      </Card>

      {/* Scores Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Resume Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${getScoreColor(candidate.resume_match_score || 0)}`}>
              {Math.round(candidate.resume_match_score || 0)}%
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              MCQ Test Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${hasTestScore ? getScoreColor(candidate.test_score) : "text-gray-400"}`}>
              {hasTestScore ? `${Math.round(candidate.test_score)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Interview Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${candidate.communication_score ? getScoreColor(candidate.communication_score) : "text-gray-400"}`}>
              {candidate.communication_score !== null && candidate.communication_score !== undefined
                ? `${Math.round(candidate.communication_score)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${getScoreColor(candidate.overall_score || 0)}`}>
              {Math.round(candidate.overall_score || candidate.resume_match_score || 0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Stage Details */}
        <div className="col-span-2 space-y-6">
          {/* Resume Screening Section */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <FileText className="h-5 w-5 text-blue-500" />
                Resume Screening
                {candidate.resume_match_score && candidate.resume_match_score > 0 && (
                  <Badge className="bg-green-500 text-white ml-2">Analyzed</Badge>
                )}
                {(!candidate.resume_match_score || candidate.resume_match_score === 0) && (
                  <Badge variant="outline" className="ml-2">Pending Analysis</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Match Score:</span>
                    {candidate.resume_match_score && candidate.resume_match_score > 0 ? (
                      <span className={`font-bold text-lg ${getScoreColor(candidate.resume_match_score)}`}>
                        {Math.round(candidate.resume_match_score)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">Not analyzed yet</span>
                    )}
                  </div>
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {candidate.resume_url && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/resume/${params.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Resume
                      </Link>
                    </Button>
                  )}
                  <Button
                    onClick={handleAnalyzeResume}
                    disabled={analyzingResume}
                    size="sm"
                    className={candidate.resume_match_score ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {analyzingResume ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {candidate.resume_match_score ? "Re-Analyze" : "Analyze Resume"}
                  </Button>
                </div>
              </div>

              {/* AI Match Analysis Results */}
              {candidate.ai_match_data && (() => {
                const aiData = typeof candidate.ai_match_data === "string"
                  ? JSON.parse(candidate.ai_match_data)
                  : candidate.ai_match_data;
                return (
                  <div className="mt-4 space-y-4 border-t pt-4 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <h4 className="font-medium dark:text-gray-100">AI Analysis</h4>
                      {aiData.recommendation && (
                        <Badge
                          className={
                            aiData.recommendation === "strong_match"
                              ? "bg-green-100 text-green-700"
                              : aiData.recommendation === "good_match"
                              ? "bg-blue-100 text-blue-700"
                              : aiData.recommendation === "potential_match"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {aiData.recommendation.replace("_", " ").toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    {aiData.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{aiData.summary}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {aiData.strengths && aiData.strengths.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            Strengths
                          </h5>
                          <ul className="space-y-1">
                            {aiData.strengths.slice(0, 3).map((strength, idx) => (
                              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiData.concerns && aiData.concerns.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            Concerns
                          </h5>
                          <ul className="space-y-1">
                            {aiData.concerns.slice(0, 3).map((concern, idx) => (
                              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                                <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {aiData.skillsMatch && (
                      <div className="space-y-2 mt-3 pt-3 border-t dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Skills Analysis</p>
                        <div className="space-y-1.5">
                          {aiData.skillsMatch.matched && aiData.skillsMatch.matched.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-green-600 dark:text-green-400 mr-1">Matched:</span>
                              {aiData.skillsMatch.matched.slice(0, 5).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs py-0 border-green-500 text-green-600 dark:text-green-400">
                                  {skill}
                                </Badge>
                              ))}
                              {aiData.skillsMatch.matched.length > 5 && (
                                <span className="text-xs text-gray-500">+{aiData.skillsMatch.matched.length - 5} more</span>
                              )}
                            </div>
                          )}
                          {aiData.skillsMatch.missing && aiData.skillsMatch.missing.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-red-600 dark:text-red-400 mr-1">Missing:</span>
                              {aiData.skillsMatch.missing.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs py-0 border-red-400 text-red-600 dark:text-red-400">
                                  {skill}
                                </Badge>
                              ))}
                              {aiData.skillsMatch.missing.length > 3 && (
                                <span className="text-xs text-gray-500">+{aiData.skillsMatch.missing.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        {aiData.experienceMatch && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Experience: {typeof aiData.experienceMatch === 'object'
                              ? `${aiData.experienceMatch.candidate || 0} years (required: ${aiData.experienceMatch.required || 0})`
                              : aiData.experienceMatch}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* MCQ Test Section */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <ClipboardList className="h-5 w-5 text-purple-500" />
                MCQ Test
                {hasTestScore && (
                  <Badge className="bg-green-500 text-white ml-2">Completed</Badge>
                )}
                {hasTestToken && !hasTestScore && (
                  <Badge variant="outline" className="ml-2">Invited</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasTestScore ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(candidate.test_score)}`}>
                        {Math.round(candidate.test_score)}%
                      </div>
                      <div>
                        <p className="font-medium dark:text-gray-100">Test Score</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Completed on {candidate.test_completed_at
                            ? new Date(candidate.test_completed_at).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {candidate.test_token && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/test/${candidate.test_token}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Test
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : hasTestToken ? (
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium dark:text-gray-100">Test Invitation Sent</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Waiting for candidate to complete the test
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/test/${candidate.test_token}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Test Link
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium dark:text-gray-100">No Test Assigned</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send an MCQ test invitation to evaluate the candidate
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleSendTestInvite} disabled={sendingTestInvite}>
                    {sendingTestInvite ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Test Invite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Async Interview Section */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Mic className="h-5 w-5 text-orange-500" />
                Async Interview
                {hasInterviewCompleted && (
                  <Badge className="bg-green-500 text-white ml-2">Completed</Badge>
                )}
                {hasInterviewToken && !hasInterviewCompleted && (
                  <Badge variant="outline" className="ml-2">Invited</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasInterviewCompleted ? (
                <div className="space-y-6">
                  {/* Audio Player */}
                  {candidate.interview_audio_url && (
                    <div>
                      <h4 className="font-medium mb-3 dark:text-gray-100">Interview Recording</h4>
                      <AudioPlayer audioUrl={candidate.interview_audio_url} />
                    </div>
                  )}

                  {/* Transcript */}
                  {candidate.interview_transcript && (
                    <div>
                      <h4 className="font-medium mb-3 dark:text-gray-100 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Transcript (AI Generated)
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                          {candidate.interview_transcript}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Evaluation */}
                  {evaluation && (
                    <div>
                      <h4 className="font-medium mb-3 dark:text-gray-100 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        AI Evaluation
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(evaluation.score || 0)}`}>
                            {evaluation.score || 0}%
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">Communication Score</span>
                        </div>

                        {evaluation.strengths && evaluation.strengths.length > 0 && (
                          <div>
                            <h5 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4" />
                              Strengths
                            </h5>
                            <ul className="space-y-1">
                              {evaluation.strengths.map((strength, idx) => (
                                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                          <div>
                            <h5 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                              <ThumbsDown className="h-4 w-4" />
                              Areas for Improvement
                            </h5>
                            <ul className="space-y-1">
                              {evaluation.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluation.feedback && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <h5 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                              Overall Feedback
                            </h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {evaluation.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : hasInterviewToken ? (
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium dark:text-gray-100">Interview Invitation Sent</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Waiting for candidate to record their interview
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/interview/${candidate.interview_token}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Interview Link
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Mic className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium dark:text-gray-100">No Interview Assigned</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send an async interview invitation to the candidate
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleSendInterviewInvite} disabled={sendingInterviewInvite}>
                    {sendingInterviewInvite ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Interview Invite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Interview Section */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Video className="h-5 w-5 text-green-500" />
                Live Interview
                {stageIndex > 3 && (
                  <Badge className="bg-green-500 text-white ml-2">Completed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium dark:text-gray-100">Schedule Live Interview</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Conduct a live video interview with the candidate
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Candidate Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm dark:text-gray-300">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm dark:text-gray-300">{candidate.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Professional Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.experience && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-sm dark:text-gray-300">
                    {candidate.experience} years of experience
                  </span>
                </div>
              )}
              {candidate.current_company && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-sm dark:text-gray-300">
                    Currently at: {candidate.current_company}
                  </span>
                </div>
              )}
              {candidate.education && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm dark:text-gray-300">{candidate.education}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="dark:bg-gray-700 dark:text-gray-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Timeline */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Applied</span>
                <span className="dark:text-gray-300">
                  {new Date(candidate.created_at).toLocaleDateString()}
                </span>
              </div>
              {candidate.test_completed_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Test Completed</span>
                  <span className="dark:text-gray-300">
                    {new Date(candidate.test_completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {candidate.interview_completed_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Interview Completed</span>
                  <span className="dark:text-gray-300">
                    {new Date(candidate.interview_completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!hasTestToken && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSendTestInvite}
                  disabled={sendingTestInvite}
                >
                  {sendingTestInvite ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="mr-2 h-4 w-4" />
                  )}
                  Send MCQ Test
                </Button>
              )}
              {!hasInterviewToken && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSendInterviewInvite}
                  disabled={sendingInterviewInvite}
                >
                  {sendingInterviewInvite ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="mr-2 h-4 w-4" />
                  )}
                  Send Interview Invite
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Live Interview
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-yellow-500" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CandidateNotes
                applicationId={candidate.id}
                currentUserId={session?.user?.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
