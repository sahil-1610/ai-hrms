"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import JobApplicationForm from "@/components/JobApplicationForm";

export default function CareersApplyPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [jobRes, settingsRes] = await Promise.all([
        fetch(`/api/jobs/${params.id}`),
        fetch("/api/company/settings"),
      ]);

      const jobData = await jobRes.json();
      const settingsData = await settingsRes.json();

      if (jobRes.ok) {
        setJob(jobData);
      } else {
        toast.error("Job not found");
        router.push("/careers");
      }

      if (settingsRes.ok) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: settings?.background_color || "#F9FAFB" }}
      >
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <JobApplicationForm
      job={job}
      settings={settings}
      variant="embedded"
      successRedirect="/careers/jobs/{id}/apply/success"
      backUrl={`/careers/jobs/${job.id}`}
    />
  );
}
