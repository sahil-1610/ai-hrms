"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { TestManagement } from "@/components/TestManagement";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  UserCheck,
  X,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  AlertCircle,
  Target,
  Award,
  Send,
} from "lucide-react";

export default function CandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [invitingToTest, setInvitingToTest] = useState(false);

  useEffect(() => {
    // Check authorization
    if (
      session &&
      session.user.role !== "hr" &&
      session.user.role !== "admin"
    ) {
      router.push("/");
      return;
    }

    if (params.id) {
      fetchJobAndCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, session]);

  useEffect(() => {
    filterCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, candidates]);

  const fetchJobAndCandidates = async () => {
    try {
      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${params.id}`);
      const jobData = await jobResponse.json();

      if (!jobResponse.ok) {
        throw new Error("Job not found");
      }

      setJob(jobData);

      // Fetch candidates for this job
      const candidatesResponse = await fetch(
        `/api/applications?job_id=${params.id}`
      );
      const candidatesData = await candidatesResponse.json();

      if (candidatesResponse.ok) {
        // Sort by match score descending
        const sorted = candidatesData.sort(
          (a, b) => (b.resume_match_score || 0) - (a.resume_match_score || 0)
        );
        setCandidates(sorted);
        setFilteredCandidates(sorted);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    if (statusFilter === "all") {
      setFilteredCandidates(candidates);
    } else {
      setFilteredCandidates(
        candidates.filter((c) => c.status === statusFilter)
      );
    }
  };

  const updateCandidateStatus = async (candidateId, newStatus) => {
    try {
      const response = await fetch(`/api/applications/${candidateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, status: newStatus } : c
        )
      );

      toast.success(`Candidate ${newStatus}`);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update candidate status");
    }
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map((c) => c.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }

    const actionLabel = action === "shortlisted" ? "shortlist" : "reject";
    const confirmMessage = `Are you sure you want to ${actionLabel} ${selectedCandidates.length} candidate(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedCandidates.map((candidateId) =>
        fetch(`/api/applications/${candidateId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} candidate(s)`);
      } else {
        // Update local state
        setCandidates((prev) =>
          prev.map((c) =>
            selectedCandidates.includes(c.id) ? { ...c, status: action } : c
          )
        );
        toast.success(
          `Successfully ${actionLabel}ed ${selectedCandidates.length} candidate(s)`
        );
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error("Error updating candidates:", error);
      toast.error("Failed to update selected candidates");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusBadge = (status) => {
    const variants = {
      submitted: { variant: "secondary", label: "Submitted" },
      shortlisted: { variant: "default", label: "Shortlisted" },
      rejected: { variant: "destructive", label: "Rejected" },
      interviewing: { variant: "default", label: "Interviewing" },
      offered: { variant: "default", label: "Offered" },
    };
    return variants[status] || { variant: "secondary", label: status };
  };

  const handleReanalyze = async (candidateId) => {
    setReanalyzing(true);
    try {
      const response = await fetch(
        `/api/applications/${candidateId}/reanalyze`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to re-analyze");
      }

      // Update the candidate in the list
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, ...data.application } : c
        )
      );

      // Update selected candidate if it's open
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate({ ...selectedCandidate, ...data.application });
      }

      toast.success(
        `Re-analyzed successfully! New score: ${Math.round(
          data.analysis.matchScore
        )}% (${data.analysis.scoreChange > 0 ? "+" : ""}${Math.round(
          data.analysis.scoreChange
        )}%)`
      );
    } catch (error) {
      console.error("Error re-analyzing candidate:", error);
      toast.error(error.message || "Failed to re-analyze candidate");
    } finally {
      setReanalyzing(false);
    }
  };

  const handleInviteToTest = async (candidateId) => {
    setInvitingToTest(true);
    try {
      const response = await fetch("/api/tests/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: candidateId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test invitation");
      }

      // Update candidate status
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, status: "interviewing" } : c
        )
      );

      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate({ ...selectedCandidate, status: "interviewing" });
      }

      // Copy test URL to clipboard
      if (data.testUrl) {
        await navigator.clipboard.writeText(data.testUrl);
        toast.success("Test invitation sent! Test URL copied to clipboard.");
      } else {
        toast.success("Test invitation sent!");
      }
    } catch (error) {
      console.error("Error inviting to test:", error);
      toast.error(error.message || "Failed to send test invitation");
    } finally {
      setInvitingToTest(false);
    }
  };

  const parseAiMatchData = (aiMatchDataString) => {
    try {
      return aiMatchDataString ? JSON.parse(aiMatchDataString) : null;
    } catch (error) {
      console.error("Error parsing AI match data:", error);
      return null;
    }
  };

  if (!job && !loading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-40" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {job.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {filteredCandidates.length} candidate
                  {filteredCandidates.length !== 1 ? "s" : ""}
                  {statusFilter !== "all" && ` (${statusFilter})`}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {selectedCandidates.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCandidates([])}
                  disabled={bulkActionLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear ({selectedCandidates.length})
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleBulkAction("shortlisted")}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Shortlist Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("rejected")}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject Selected
                </Button>
              </>
            )}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={loading}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="offered">Offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Test Management */}
      {!loading && params.id && <TestManagement jobId={params.id} />}

      {/* Candidates List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <Skeleton className="h-16 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-20 mt-1 mx-auto" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-16">
            <UserCheck className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
              No candidates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === "all"
                ? "No applications received yet"
                : `No ${statusFilter} candidates`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          {filteredCandidates.length > 1 && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <Checkbox
                id="select-all-candidates"
                checked={
                  selectedCandidates.length === filteredCandidates.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all-candidates"
                className="text-sm font-medium cursor-pointer dark:text-gray-300"
              >
                Select all {filteredCandidates.length} candidates
              </label>
            </div>
          )}

          {/* Candidates List */}
          <div className="grid gap-4">
            {filteredCandidates.map((candidate, index) => (
              <Card
                key={candidate.id}
                className={`hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 ${
                  selectedCandidates.includes(candidate.id)
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedCandidates.includes(candidate.id)}
                      onCheckedChange={(e) => {
                        e.stopPropagation();
                        toggleCandidateSelection(candidate.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div
                      className="flex items-start justify-between flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setDialogOpen(true);
                      }}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                            #{index + 1}
                          </div>
                          <CardTitle className="text-xl dark:text-gray-100">
                            {candidate.name}
                          </CardTitle>
                          <Badge {...getStatusBadge(candidate.status)} />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div
                          className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(
                            candidate.resume_match_score || 0
                          )}`}
                        >
                          {Math.round(candidate.resume_match_score || 0)}%
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Match Score
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between ml-10">
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills && candidate.skills.length > 0 ? (
                        <>
                          {candidate.skills.slice(0, 4).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="dark:border-gray-600 dark:text-gray-300"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 4 && (
                            <Badge
                              variant="outline"
                              className="dark:border-gray-600 dark:text-gray-300"
                            >
                              +{candidate.skills.length - 4} more
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No skills listed
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Applied{" "}
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl dark:text-gray-100">
                  {selectedCandidate.name}
                </DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Applied on{" "}
                  {new Date(selectedCandidate.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Match Score */}
                <Card
                  className={getScoreColor(
                    selectedCandidate.resume_match_score || 0
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Star className="h-8 w-8" />
                        <div>
                          <p className="font-semibold text-lg">
                            AI Match Score
                          </p>
                          <p className="text-sm opacity-80">
                            Based on semantic resume analysis
                          </p>
                        </div>
                      </div>
                      <div className="text-4xl font-bold">
                        {Math.round(selectedCandidate.resume_match_score || 0)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis Section */}
                {(() => {
                  const aiAnalysis = parseAiMatchData(
                    selectedCandidate.ai_match_data
                  );
                  return aiAnalysis ? (
                    <div className="space-y-4">
                      {/* Recommendation Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            AI Recommendation
                          </span>
                        </div>
                        <Badge
                          variant={
                            aiAnalysis.recommendation === "Strong Match"
                              ? "default"
                              : aiAnalysis.recommendation === "Good Match"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            aiAnalysis.recommendation === "Strong Match"
                              ? "bg-green-600"
                              : aiAnalysis.recommendation === "Good Match"
                              ? "bg-blue-600"
                              : ""
                          }
                        >
                          <Award className="mr-1 h-3 w-3" />
                          {aiAnalysis.recommendation}
                        </Badge>
                      </div>

                      {/* AI Summary */}
                      {aiAnalysis.summary && (
                        <Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
                          <CardContent className="pt-4">
                            <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">
                              {aiAnalysis.summary}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Strengths */}
                      {aiAnalysis.strengths &&
                        aiAnalysis.strengths.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Strengths
                              </p>
                            </div>
                            <ul className="space-y-1.5 ml-6">
                              {aiAnalysis.strengths.map((strength, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-green-600 dark:text-green-400 mt-0.5">
                                    •
                                  </span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Concerns */}
                      {aiAnalysis.concerns &&
                        aiAnalysis.concerns.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Concerns / Gaps
                              </p>
                            </div>
                            <ul className="space-y-1.5 ml-6">
                              {aiAnalysis.concerns.map((concern, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-orange-600 dark:text-orange-400 mt-0.5">
                                    •
                                  </span>
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Skills Match */}
                      {aiAnalysis.skillsMatch && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Skills Analysis
                            </p>
                          </div>
                          <div className="grid gap-3">
                            {aiAnalysis.skillsMatch.matched &&
                              aiAnalysis.skillsMatch.matched.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1.5">
                                    ✓ Matched Skills
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {aiAnalysis.skillsMatch.matched.map(
                                      (skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="border-green-600 text-green-700 dark:border-green-500 dark:text-green-400"
                                        >
                                          {skill}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            {aiAnalysis.skillsMatch.missing &&
                              aiAnalysis.skillsMatch.missing.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1.5">
                                    ✗ Missing Skills
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {aiAnalysis.skillsMatch.missing.map(
                                      (skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="border-red-600 text-red-700 dark:border-red-500 dark:text-red-400"
                                        >
                                          {skill}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            {aiAnalysis.skillsMatch.additional &&
                              aiAnalysis.skillsMatch.additional.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1.5">
                                    + Additional Skills
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {aiAnalysis.skillsMatch.additional.map(
                                      (skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="border-blue-600 text-blue-700 dark:border-blue-500 dark:text-blue-400"
                                        >
                                          {skill}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Experience Match */}
                      {aiAnalysis.experienceMatch && (
                        <Card className="bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Briefcase className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  Experience Match
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {aiAnalysis.experienceMatch.analysis}
                                </p>
                                {aiAnalysis.experienceMatch.candidateYears !==
                                  null && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Candidate has{" "}
                                    {aiAnalysis.experienceMatch.candidateYears}{" "}
                                    years of experience
                                  </p>
                                )}
                              </div>
                              {aiAnalysis.experienceMatch.meetsRequirement && (
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Re-analyzed timestamp */}
                      {aiAnalysis.reanalyzedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Last analyzed on{" "}
                          {new Date(aiAnalysis.reanalyzedAt).toLocaleString()}{" "}
                          by {aiAnalysis.reanalyzedBy || "system"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                              No AI Analysis Available
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              This application was submitted before AI analysis
                              was enabled. Click &quot;Re-analyze with AI&quot;
                              to generate insights.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                <Separator />

                {/* Contact Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-base dark:text-gray-100">{selectedCandidate.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-base dark:text-gray-100">{selectedCandidate.phone}</p>
                  </div>
                  {selectedCandidate.current_company && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Current Company
                      </p>
                      <p className="text-base dark:text-gray-100">
                        {selectedCandidate.current_company}
                      </p>
                    </div>
                  )}
                  {selectedCandidate.experience && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Experience
                      </p>
                      <p className="text-base dark:text-gray-100">
                        {selectedCandidate.experience} years
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Skills */}
                {selectedCandidate.skills &&
                  selectedCandidate.skills.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Education */}
                {selectedCandidate.education && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Education
                    </p>
                    <p className="text-base text-gray-700 dark:text-gray-300">
                      {selectedCandidate.education}
                    </p>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedCandidate.cover_letter && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Cover Letter
                    </p>
                    <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedCandidate.cover_letter}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReanalyze(selectedCandidate.id)}
                      disabled={reanalyzing}
                    >
                      {reanalyzing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Re-analyze with AI
                    </Button>
                    {selectedCandidate.status !== "interviewing" &&
                      selectedCandidate.status !== "rejected" &&
                      !selectedCandidate.test_token && (
                        <Button
                          variant="default"
                          onClick={() =>
                            handleInviteToTest(selectedCandidate.id)
                          }
                          disabled={invitingToTest}
                        >
                          {invitingToTest ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          Invite to Test
                        </Button>
                      )}
                    {selectedCandidate.test_token && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const testUrl = `${window.location.origin}/test/${selectedCandidate.test_token}`;
                          navigator.clipboard.writeText(testUrl);
                          toast.success("Test URL copied to clipboard");
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Copy Test URL
                      </Button>
                    )}
                    {selectedCandidate.resume_url && (
                      <Button variant="outline" asChild>
                        <a
                          href={selectedCandidate.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Resume
                        </a>
                      </Button>
                    )}
                    {selectedCandidate.status !== "shortlisted" && (
                      <Button
                        onClick={() =>
                          updateCandidateStatus(
                            selectedCandidate.id,
                            "shortlisted"
                          )
                        }
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Shortlist
                      </Button>
                    )}
                    {selectedCandidate.status !== "rejected" && (
                      <Button
                        variant="destructive"
                        onClick={() =>
                          updateCandidateStatus(
                            selectedCandidate.id,
                            "rejected"
                          )
                        }
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
