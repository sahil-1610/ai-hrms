"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import AdvancedSearch from "@/components/AdvancedSearch";
import BulkOperations from "@/components/BulkOperations";
import {
  Users,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  Loader2,
  ClipboardList,
  Mic,
  Video,
  ChevronRight,
  MapPin,
  Calendar,
  TrendingUp,
  UserCheck,
  Clock,
} from "lucide-react";

// Pipeline stage definitions
const PIPELINE_STAGES = [
  { key: "resume_screening", label: "Resume", shortLabel: "Resume", icon: FileText },
  { key: "mcq_test", label: "MCQ Test", shortLabel: "MCQ", icon: ClipboardList },
  { key: "async_interview", label: "Async Interview", shortLabel: "Async", icon: Mic },
  { key: "live_interview", label: "Live Interview", shortLabel: "Live", icon: Video },
  { key: "offer", label: "Offer", shortLabel: "Offer", icon: Star },
];

// Pipeline Stage Indicator Component
function PipelineStageIndicator({ currentStage, small = false }) {
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStage);

  if (currentStage === "hired") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
        <UserCheck className="w-3 h-3 mr-1" />
        Hired
      </Badge>
    );
  }

  if (currentStage === "rejected") {
    return (
      <Badge variant="destructive" className="opacity-75">
        Rejected
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = idx < stageIndex;
        const isCurrent = idx === stageIndex;

        return (
          <div key={stage.key} className="flex items-center">
            <div
              className={`${small ? "w-2 h-2" : "w-2.5 h-2.5"} rounded-full transition-colors ${
                isCompleted
                  ? "bg-green-500"
                  : isCurrent
                  ? "bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
              title={stage.label}
            />
            {idx < PIPELINE_STAGES.length - 1 && (
              <div
                className={`w-2 h-0.5 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            )}
          </div>
        );
      })}
      {stageIndex >= 0 && (
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 ml-1">
          {PIPELINE_STAGES[stageIndex]?.shortLabel || currentStage}
        </span>
      )}
    </div>
  );
}

// Candidate Card Component
function CandidateCard({ candidate, jobTitle, onClick, isSelected, onSelect }) {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-lg transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(candidate.id, checked)}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {candidate.name}
            </h4>
            <PipelineStageIndicator
              currentStage={candidate.current_stage || "resume_screening"}
              small
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">{candidate.email}</span>
            </span>
            {candidate.experience && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {candidate.experience}y exp
              </span>
            )}
          </div>
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.skills.slice(0, 3).map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs px-2 py-0 dark:bg-gray-700 dark:text-gray-300"
                >
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0 dark:bg-gray-700 dark:text-gray-300"
                >
                  +{candidate.skills.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className={`text-xl font-bold px-3 py-1 rounded-lg border ${getScoreColor(
              candidate.resume_match_score || 0
            )}`}
          >
            {Math.round(candidate.resume_match_score || 0)}%
          </div>
          <span className="text-xs text-gray-400">
            {new Date(candidate.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end mt-3 pt-3 border-t dark:border-gray-700" onClick={onClick}>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline flex items-center">
          View Profile
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
}

// Job Category Section Component
function JobCategorySection({ job, candidates, onCandidateClick, selectedIds, onSelect }) {
  const [expanded, setExpanded] = useState(true);

  const stats = useMemo(() => {
    return {
      total: candidates.length,
      avgScore: candidates.length > 0
        ? Math.round(
            candidates.reduce((sum, c) => sum + (c.resume_match_score || 0), 0) /
              candidates.length
          )
        : 0,
      inProgress: candidates.filter(
        (c) => !["hired", "rejected"].includes(c.current_stage)
      ).length,
      hired: candidates.filter((c) => c.current_stage === "hired").length,
    };
  }, [candidates]);

  return (
    <Card className="dark:bg-gray-800/50 dark:border-gray-700 overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg dark:text-gray-100">
                {job.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-0.5">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.total} candidates
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <div className="text-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {stats.avgScore}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Avg Score
                </div>
              </div>
              <div className="text-center px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.inProgress}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  In Progress
                </div>
              </div>
              <div className="text-center px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {stats.hired}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Hired
                </div>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No candidates for this position yet</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  jobTitle={job.title}
                  onClick={() => onCandidateClick(candidate.id)}
                  isSelected={selectedIds?.includes(candidate.id)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AllCandidatesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchFilters, setSearchFilters] = useState({});

  useEffect(() => {
    if (
      session &&
      session.user.role !== "hr" &&
      session.user.role !== "admin"
    ) {
      router.push("/");
      return;
    }

    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      const [jobsResponse, candidatesResponse] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/applications"),
      ]);

      const jobsData = await jobsResponse.json();
      const candidatesData = await candidatesResponse.json();

      if (jobsResponse.ok) {
        setJobs(jobsData);
      }

      if (candidatesResponse.ok) {
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

  // Group candidates by job
  const groupedCandidates = useMemo(() => {
    let filtered = [...candidates];

    // Apply search filters
    if (searchFilters.search) {
      const searchLower = searchFilters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.skills?.some((s) => s.toLowerCase().includes(searchLower))
      );
    }

    if (searchFilters.jobId) {
      filtered = filtered.filter((c) => c.job_id === searchFilters.jobId);
    }

    if (searchFilters.status) {
      filtered = filtered.filter((c) => c.status === searchFilters.status);
    }

    if (searchFilters.stage) {
      filtered = filtered.filter((c) => c.current_stage === searchFilters.stage);
    }

    if (searchFilters.minScore > 0) {
      filtered = filtered.filter(
        (c) => (c.resume_match_score || 0) >= searchFilters.minScore
      );
    }

    if (searchFilters.maxScore < 100) {
      filtered = filtered.filter(
        (c) => (c.resume_match_score || 0) <= searchFilters.maxScore
      );
    }

    if (searchFilters.skills?.length > 0) {
      filtered = filtered.filter((c) =>
        searchFilters.skills.every((skill) =>
          c.skills?.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    // Filter by stage if selected (from quick filter)
    if (selectedStage !== "all") {
      filtered = filtered.filter((c) => c.current_stage === selectedStage);
    }

    // Group by job
    const groups = {};
    filtered.forEach((candidate) => {
      const jobId = candidate.job_id;
      if (!groups[jobId]) {
        groups[jobId] = [];
      }
      groups[jobId].push(candidate);
    });

    return groups;
  }, [candidates, selectedStage, searchFilters]);

  // Filter jobs based on selection
  const filteredJobs = useMemo(() => {
    if (selectedJob === "all") {
      return jobs.filter((job) => groupedCandidates[job.id]?.length > 0);
    }
    return jobs.filter((job) => job.id === selectedJob);
  }, [jobs, selectedJob, groupedCandidates]);

  // Overall stats
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      screening: candidates.filter((c) => c.current_stage === "resume_screening").length,
      testing: candidates.filter((c) => c.current_stage === "mcq_test").length,
      interviewing: candidates.filter(
        (c) => ["async_interview", "live_interview"].includes(c.current_stage)
      ).length,
      offered: candidates.filter((c) => c.current_stage === "offer").length,
      hired: candidates.filter((c) => c.current_stage === "hired").length,
    };
  }, [candidates]);

  const handleCandidateClick = (candidateId) => {
    router.push(`/admin/candidates/${candidateId}`);
  };

  const handleSelect = useCallback((candidateId, checked) => {
    setSelectedIds((prev) =>
      checked
        ? [...prev, candidateId]
        : prev.filter((id) => id !== candidateId)
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleSearch = useCallback((filters) => {
    setSearchFilters(filters);
    // Clear selection when filters change
    setSelectedIds([]);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-32 rounded-xl" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          All Candidates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage all applications grouped by job positions
        </p>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        onSearch={handleSearch}
        jobs={jobs}
        initialFilters={searchFilters}
      />

      {/* Bulk Operations */}
      {selectedIds.length > 0 && (
        <BulkOperations
          selectedIds={selectedIds}
          onClearSelection={handleClearSelection}
          onActionComplete={fetchData}
          candidates={candidates.filter((c) => selectedIds.includes(c.id))}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.screening}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Screening</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <ClipboardList className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.testing}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Testing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.interviewing}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Interview</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.offered}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Offered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.hired}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Filter Chips */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Job Position
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedJob("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedJob === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All Positions
            <Badge
              variant="secondary"
              className={`ml-2 ${
                selectedJob === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {candidates.length}
            </Badge>
          </button>
          {jobs.map((job) => {
            const count = candidates.filter((c) => c.job_id === job.id).length;
            if (count === 0) return null;
            return (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedJob === job.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {job.title}
                <Badge
                  variant="secondary"
                  className={`ml-2 ${
                    selectedJob === job.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Filter Chips */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Stage
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStage("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedStage === "all"
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All Stages
          </button>
          {PIPELINE_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.key}
                onClick={() => setSelectedStage(stage.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedStage === stage.key
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-3 h-3" />
                {stage.label}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedStage("hired")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStage === "hired"
                ? "bg-green-600 text-white"
                : "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Hired
          </button>
          <button
            onClick={() => setSelectedStage("rejected")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedStage === "rejected"
                ? "bg-red-600 text-white"
                : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Candidates by Job Category */}
      {filteredJobs.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-16">
            <Users className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
              No candidates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedJob === "all" && selectedStage === "all"
                ? "No applications received yet"
                : "No candidates match the current filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <JobCategorySection
              key={job.id}
              job={job}
              candidates={groupedCandidates[job.id] || []}
              onCandidateClick={handleCandidateClick}
              selectedIds={selectedIds}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
