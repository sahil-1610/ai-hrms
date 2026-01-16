"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Search,
  ChevronRight,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Embeddable Jobs Listing Page
 *
 * This page lists all active jobs and can be embedded in an iframe on external websites.
 *
 * Usage:
 *   <iframe
 *     src="https://your-domain.com/embed/jobs"
 *     width="100%"
 *     height="600"
 *     frameborder="0"
 *   ></iframe>
 *
 * Optional query params:
 *   ?department=Engineering - Filter by department
 *   ?location=Remote - Filter by location
 *   ?limit=10 - Limit number of jobs shown
 *   ?hideSearch=true - Hide the search bar
 *   ?hideHeader=true - Hide the company header
 *   ?compact=true - Use compact card layout
 */
export default function EmbedJobsPage() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(
    searchParams.get("department") || ""
  );

  const hideSearch = searchParams.get("hideSearch") === "true";
  const hideHeader = searchParams.get("hideHeader") === "true";
  const compact = searchParams.get("compact") === "true";
  const limitParam = searchParams.get("limit");
  const locationFilter = searchParams.get("location") || "";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, settingsRes] = await Promise.all([
        fetch("/api/jobs?status=active"),
        fetch("/api/company/settings"),
      ]);

      const jobsData = await jobsRes.json();
      const settingsData = await settingsRes.json();

      if (jobsRes.ok) {
        let filteredJobs = jobsData.jobs || jobsData || [];

        // Apply location filter from URL
        if (locationFilter) {
          filteredJobs = filteredJobs.filter(job =>
            job.location?.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }

        setJobs(filteredJobs);

        // Extract unique departments
        const depts = [...new Set(filteredJobs.map(job => job.department).filter(Boolean))];
        setDepartments(depts);
      }

      if (settingsRes.ok) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = settings?.primary_color || "#3B82F6";
  const secondaryColor = settings?.secondary_color || "#8B5CF6";

  // Filter jobs based on search and department
  let filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery ||
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = !selectedDepartment ||
      job.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Apply limit if specified
  if (limitParam) {
    const limit = parseInt(limitParam, 10);
    if (!isNaN(limit) && limit > 0) {
      filteredJobs = filteredJobs.slice(0, limit);
    }
  }

  const handleJobClick = (jobId) => {
    // Open apply page - can be in same iframe or new window based on parent preference
    const applyUrl = `/embed/apply/${jobId}`;

    // Post message to parent for custom handling
    if (window.parent !== window) {
      window.parent.postMessage({
        type: "JOB_SELECTED",
        jobId: jobId,
        applyUrl: applyUrl,
      }, "*");
    }

    // Default: navigate within iframe
    window.location.href = applyUrl;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!hideHeader && (
        <div
          className="py-6 px-6"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.company_name}
                  className="h-10 object-contain bg-white/20 rounded px-2 py-1"
                />
              ) : (
                <Building2 className="h-8 w-8 text-white" />
              )}
              <span className="text-xl font-bold text-white">
                {settings?.company_name || "Company"} Careers
              </span>
            </div>
            <p className="text-white/80">
              Join our team and help us build the future
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Search and Filters */}
        {!hideSearch && (
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs by title, department, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>

            {departments.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedDepartment === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment("")}
                  style={selectedDepartment === "" ? { backgroundColor: primaryColor } : {}}
                >
                  All Departments
                </Button>
                {departments.map(dept => (
                  <Button
                    key={dept}
                    variant={selectedDepartment === dept ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDepartment(dept)}
                    style={selectedDepartment === dept ? { backgroundColor: primaryColor } : {}}
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs Count */}
        <div className="mb-4 flex items-center gap-2 text-gray-600">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">
            {filteredJobs.length} open position{filteredJobs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No open positions
            </h3>
            <p className="text-gray-500">
              {searchQuery || selectedDepartment
                ? "Try adjusting your search filters"
                : "Check back later for new opportunities"}
            </p>
          </div>
        ) : (
          <div className={`space-y-${compact ? "3" : "4"}`}>
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job.id)}
                className={`bg-white rounded-lg border hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group ${
                  compact ? "p-4" : "p-6"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-gray-900 group-hover:text-blue-600 transition-colors ${
                        compact ? "text-base" : "text-lg"
                      }`}
                      style={{ "--hover-color": primaryColor }}
                    >
                      {job.title}
                    </h3>

                    <div className={`flex flex-wrap gap-3 text-gray-500 ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
                      {job.department && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.department}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      {(job.experience_min || job.experience_max) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {job.experience_min}-{job.experience_max} years
                        </span>
                      )}
                    </div>

                    {!compact && job.type && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {job.type}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center shrink-0">
                    <ChevronRight
                      className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        {limitParam && jobs.length > filteredJobs.length && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => {
                if (window.parent !== window) {
                  window.parent.postMessage({
                    type: "VIEW_ALL_JOBS",
                  }, "*");
                }
              }}
            >
              View all {jobs.length} positions
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t mt-8 bg-white">
        <p className="text-xs text-gray-400">
          Powered by AI-HRMS
        </p>
      </div>
    </div>
  );
}
