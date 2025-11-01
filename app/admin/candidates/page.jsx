"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Users,
  X,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
} from "lucide-react";

export default function AllCandidatesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    filterCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, jobFilter, candidates]);

  const fetchData = async () => {
    try {
      // Fetch all jobs
      const jobsResponse = await fetch("/api/jobs");
      const jobsData = await jobsResponse.json();
      if (jobsResponse.ok) {
        setJobs(jobsData);
      }

      // Fetch all candidates/applications
      const candidatesResponse = await fetch("/api/applications");
      const candidatesData = await candidatesResponse.json();

      if (candidatesResponse.ok) {
        // Sort by match score descending and created date
        const sorted = candidatesData.sort(
          (a, b) =>
            (b.resume_match_score || 0) - (a.resume_match_score || 0) ||
            new Date(b.created_at) - new Date(a.created_at)
        );
        setCandidates(sorted);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (jobFilter !== "all") {
      filtered = filtered.filter((c) => c.job_id === jobFilter);
    }

    setFilteredCandidates(filtered);
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

  const getJobTitle = (jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    return job ? job.title : "Unknown Job";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          All Candidates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage all applications across all jobs
        </p>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Select
            value={jobFilter}
            onValueChange={setJobFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold dark:text-gray-100">
              {candidates.length}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Shortlisted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {candidates.filter((c) => c.status === "shortlisted").length}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Interviewing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {candidates.filter((c) => c.status === "interviewing").length}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Offered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {candidates.filter((c) => c.status === "offered").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-16 w-24 rounded-lg" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-16">
            <Users className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
              No candidates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === "all" && jobFilter === "all"
                ? "No applications received yet"
                : "No candidates match the current filters"}
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
            {filteredCandidates.map((candidate, index) => {
              const statusInfo = getStatusBadge(candidate.status);
              return (
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
                        onCheckedChange={() =>
                          toggleCandidateSelection(candidate.id)
                        }
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
                            <CardTitle className="text-xl dark:text-gray-100">
                              {candidate.name}
                            </CardTitle>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center font-medium text-blue-600 dark:text-blue-400">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {getJobTitle(candidate.job_id)}
                            </span>
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {candidate.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {candidate.phone}
                            </span>
                            {candidate.experience && (
                              <span className="flex items-center">
                                <GraduationCap className="h-4 w-4 mr-1" />
                                {candidate.experience} years exp.
                              </span>
                            )}
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
                          <p className="text-xs text-gray-500 mt-1">
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
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Candidate Details
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Review candidate information and update status
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <>
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold dark:text-gray-100">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Applied for: {getJobTitle(selectedCandidate.job_id)}
                    </p>
                  </div>
                  <div
                    className={`text-4xl font-bold px-6 py-3 rounded-lg ${getScoreColor(
                      selectedCandidate.resume_match_score || 0
                    )}`}
                  >
                    {Math.round(selectedCandidate.resume_match_score || 0)}%
                  </div>
                </div>

                <Separator className="dark:bg-gray-700" />

                {/* Contact Info */}
                <div>
                  <h4 className="font-semibold mb-3 dark:text-gray-100">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="dark:text-gray-300">
                        {selectedCandidate.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="dark:text-gray-300">
                        {selectedCandidate.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                {(selectedCandidate.experience ||
                  selectedCandidate.current_company ||
                  selectedCandidate.education) && (
                  <>
                    <Separator className="dark:bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-3 dark:text-gray-100">
                        Professional Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedCandidate.experience && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="dark:text-gray-300">
                              {selectedCandidate.experience} years of experience
                            </span>
                          </div>
                        )}
                        {selectedCandidate.current_company && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="dark:text-gray-300">
                              Currently at: {selectedCandidate.current_company}
                            </span>
                          </div>
                        )}
                        {selectedCandidate.education && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="dark:text-gray-300">
                              {selectedCandidate.education}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Skills */}
                {selectedCandidate.skills &&
                  selectedCandidate.skills.length > 0 && (
                    <>
                      <Separator className="dark:bg-gray-700" />
                      <div>
                        <h4 className="font-semibold mb-3 dark:text-gray-100">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCandidate.skills.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="dark:bg-gray-700 dark:text-gray-300"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Cover Letter */}
                {selectedCandidate.cover_letter && (
                  <>
                    <Separator className="dark:bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-3 dark:text-gray-100">
                        Cover Letter
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedCandidate.cover_letter}
                      </p>
                    </div>
                  </>
                )}

                {/* Resume */}
                {selectedCandidate.resume_url && (
                  <>
                    <Separator className="dark:bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-3 dark:text-gray-100">
                        Resume
                      </h4>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={selectedCandidate.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Resume
                        </a>
                      </Button>
                    </div>
                  </>
                )}

                {/* Actions */}
                <Separator className="dark:bg-gray-700" />
                <div>
                  <h4 className="font-semibold mb-3 dark:text-gray-100">
                    Update Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.status !== "shortlisted" && (
                      <Button
                        variant="default"
                        onClick={() =>
                          updateCandidateStatus(
                            selectedCandidate.id,
                            "shortlisted"
                          )
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Shortlist
                      </Button>
                    )}
                    {selectedCandidate.status !== "interviewing" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateCandidateStatus(
                            selectedCandidate.id,
                            "interviewing"
                          )
                        }
                      >
                        Schedule Interview
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
