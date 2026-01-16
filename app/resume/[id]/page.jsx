"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  FileText,
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

export default function ResumeViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !["hr", "admin"].includes(session.user?.role)) {
      router.push("/login");
      return;
    }

    if (params.id) {
      fetchApplication();
    }
  }, [session, status, params.id]);

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setApplication(data);
      } else {
        toast.error("Application not found");
        router.push("/admin/candidates");
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load resume");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">
              Resume Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The requested resume could not be found.
            </p>
            <Button asChild>
              <Link href="/admin/candidates">Back to Candidates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the proxy API endpoint for the PDF
  const resumeUrl = `/api/applications/${params.id}/resume`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/admin/candidates/${params.id}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                    {application.name}'s Resume
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {application.jobs?.title || "Job Application"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <a href={resumeUrl} download={`${application.name}_Resume.pdf`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PDF Viewer - Main Content */}
          <div className="lg:col-span-3">
            <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full h-[85vh]">
                  <iframe
                    src={resumeUrl}
                    className="w-full h-full border-0"
                    title={`${application.name}'s Resume`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Candidate Info */}
          <div className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Candidate Details
                </h3>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {application.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {application.email}
                  </span>
                </div>
                {application.current_company && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {application.current_company}
                    </span>
                  </div>
                )}
                {application.experience && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {application.experience} years exp.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href={`/admin/candidates/${params.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
