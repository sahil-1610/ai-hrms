"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import JobApplicationForm from "@/components/JobApplicationForm";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setJob(data);
      } else {
        toast.error("Job not found");
        router.push("/jobs");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <JobApplicationForm
      job={job}
      variant="default"
      successRedirect="/jobs/{id}/apply/success"
      backUrl={`/jobs/${job.id}`}
    />
  );
}
