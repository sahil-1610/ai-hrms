"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Loader2,
  X,
  Archive,
} from "lucide-react";

const STATUS_FILTERS = [
  { value: "all", label: "All", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch jobs");
      }

      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error(error.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobSelection = (jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleBulkClose = async () => {
    if (selectedJobs.length === 0) {
      toast.error("Please select at least one job to close");
      return;
    }

    const confirmMessage = `Are you sure you want to close ${selectedJobs.length} job(s)? This will stop accepting new applications.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedJobs.map((jobId) =>
        fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "closed" }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        toast.error(`Failed to close ${failed.length} job(s)`);
      } else {
        toast.success(`Successfully closed ${selectedJobs.length} job(s)`);
        setSelectedJobs([]);
        fetchJobs();
      }
    } catch (error) {
      console.error("Error closing jobs:", error);
      toast.error("Failed to close selected jobs");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Filter jobs by status
  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return jobs;
    return jobs.filter((job) => job.status === statusFilter);
  }, [jobs, statusFilter]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const counts = { all: jobs.length, active: 0, closed: 0, draft: 0 };
    jobs.forEach((job) => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      }
    });
    return counts;
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Job Postings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your job openings and track applications
          </p>
        </div>
        <div className="flex gap-2">
          {selectedJobs.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectedJobs([])}
                disabled={bulkActionLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Clear ({selectedJobs.length})
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkClose}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="mr-2 h-4 w-4" />
                )}
                Close Selected
              </Button>
            </>
          )}
          <Button asChild>
            <Link href="/admin/jobs/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatusFilter(filter.value);
              setSelectedJobs([]); // Clear selection when changing filter
            }}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === filter.value
                ? `${filter.color} ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {filter.label}
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              statusFilter === filter.value
                ? "bg-white/30 dark:bg-black/20"
                : "bg-gray-200 dark:bg-gray-700"
            }`}>
              {statusCounts[filter.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-16">
            <Briefcase className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
              No jobs yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first job posting to start receiving applications
            </p>
            <Button asChild>
              <Link href="/admin/jobs/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredJobs.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-16">
            <Briefcase className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
              No {statusFilter} jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There are no jobs with the selected status
            </p>
            <Button variant="outline" onClick={() => setStatusFilter("all")}>
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          {filteredJobs.length > 1 && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <Checkbox
                id="select-all"
                checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                onCheckedChange={() => {
                  if (selectedJobs.length === filteredJobs.length) {
                    setSelectedJobs([]);
                  } else {
                    setSelectedJobs(filteredJobs.map((job) => job.id));
                  }
                }}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer dark:text-gray-300"
              >
                Select all {filteredJobs.length} jobs
              </label>
            </div>
          )}

          {/* Jobs List */}
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={`hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 ${
                  selectedJobs.includes(job.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedJobs.includes(job.id)}
                      onCheckedChange={() => toggleJobSelection(job.id)}
                      className="mt-1"
                    />
                    <div className="flex items-start justify-between flex-1">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl dark:text-gray-100">
                          {job.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 text-sm dark:text-gray-400">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.experience_min}-{job.experience_max} years
                          </span>
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          job.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : job.status === "closed"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between ml-10">
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {job.applicationCount || 0} applications
                      </span>
                      {job.number_of_positions && job.number_of_positions > 1 && (
                        <span className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.number_of_positions} positions
                        </span>
                      )}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex gap-2">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs dark:border-gray-600 dark:text-gray-300"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs dark:border-gray-600 dark:text-gray-300"
                            >
                              +{job.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/jobs/${job.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/jobs/${job.id}/candidates`}>
                          Candidates ({job.applicationCount || 0})
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
