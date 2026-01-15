"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowLeft,
  Building2,
  Sparkles,
} from "lucide-react";

const statusConfig = {
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: FileText,
    description: "Your application has been received and is under review",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    iconColor: "text-green-600 dark:text-green-400",
    icon: CheckCircle2,
    description: "Great news! You've been shortlisted for the next round",
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    iconColor: "text-red-600 dark:text-red-400",
    icon: XCircle,
    description:
      "Thank you for your interest. Unfortunately, we're moving forward with other candidates",
  },
  interviewing: {
    label: "Interviewing",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    iconColor: "text-purple-600 dark:text-purple-400",
    icon: Clock,
    description:
      "You're in the interview stage. Check your email for next steps",
  },
  offered: {
    label: "Offer Extended",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    icon: Award,
    description: "Congratulations! We've extended an offer. Check your email",
  },
  hired: {
    label: "Hired",
    color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    iconColor: "text-green-600 dark:text-green-400",
    icon: CheckCircle2,
    description: "Welcome aboard! You've been hired",
  },
};

export default function StatusPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  const token = params.token;

  useEffect(() => {
    if (token) {
      fetchApplicationStatus();
    }
  }, [token]);

  const fetchApplicationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch application by token
      const appResponse = await fetch(
        `/api/applications?token=${encodeURIComponent(token)}`
      );
      const appData = await appResponse.json();

      if (!appResponse.ok || !appData || appData.length === 0) {
        throw new Error("Application not found. Please check your token.");
      }

      const app = Array.isArray(appData) ? appData[0] : appData;
      setApplication(app);

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${app.job_id}`);
      const jobData = await jobResponse.json();

      if (jobResponse.ok) {
        setJob(jobData);
      }
    } catch (err) {
      console.error("Error fetching application status:", err);
      setError(err.message || "Failed to load application status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center dark:text-gray-100">Application Not Found</CardTitle>
            <CardDescription className="text-center dark:text-gray-400">
              {error ||
                "We couldn't find an application with this tracking token."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="dark:bg-blue-600 dark:hover:bg-blue-700">
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[application.status] || statusConfig.submitted;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4 dark:text-gray-300 dark:hover:bg-gray-800">
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Application Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track your application progress</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className={`h-2 ${statusInfo.color.split(' ')[0]}`}></div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${statusInfo.color} shadow-sm`}
                  >
                    <StatusIcon className={`h-7 w-7 ${statusInfo.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl dark:text-gray-100">
                      Current Status: {statusInfo.label}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 mt-1">
                      {statusInfo.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={`${statusInfo.color} border-0 px-4 py-1`}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Application Details */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Position
                </label>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {job.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-2">
                  <Building2 className="h-4 w-4" />
                  {job.location}
                </p>
              </div>
            )}

            <Separator className="dark:bg-gray-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Applicant Name
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-medium mt-1">{application.name}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{application.email}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{application.phone}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Applied On
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(application.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            {application.resume_match_score !== null &&
              application.resume_match_score !== undefined &&
              application.resume_match_score > 0 && (
                <>
                  <Separator className="dark:bg-gray-700" />
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      AI Match Score
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <Badge
                        variant={
                          application.resume_match_score >= 70
                            ? "default"
                            : application.resume_match_score >= 50
                            ? "secondary"
                            : "outline"
                        }
                        className={`text-lg px-4 py-2 ${
                          application.resume_match_score >= 70
                            ? "bg-green-600 hover:bg-green-700"
                            : application.resume_match_score >= 50
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : ""
                        }`}
                      >
                        {Math.round(application.resume_match_score)}% Match
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {application.resume_match_score >= 70
                          ? "Excellent match with job requirements!"
                          : application.resume_match_score >= 50
                          ? "Good match with job requirements"
                          : "Your application is being reviewed"}
                      </span>
                    </div>
                  </div>
                </>
              )}

            {(!application.resume_match_score || application.resume_match_score === 0) && (
              <>
                <Separator className="dark:bg-gray-700" />
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Resume Analysis
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="outline" className="text-sm px-3 py-1 dark:border-amber-700 dark:text-amber-300">
                      Pending Review
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Your resume will be analyzed by our HR team
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                {application.status === "submitted" && (
                  <p className="text-gray-700 dark:text-gray-300">
                    Your application is being reviewed by our hiring team. We'll
                    notify you via email if you're shortlisted for the next round.
                  </p>
                )}
                {application.status === "shortlisted" && (
                  <p className="text-gray-700 dark:text-gray-300">
                    Congratulations! You've been shortlisted. Check your email for
                    next steps, which may include an assessment or interview
                    invitation.
                  </p>
                )}
                {application.status === "interviewing" && (
                  <p className="text-gray-700 dark:text-gray-300">
                    You're in the interview stage. Please check your email for
                    interview scheduling details and preparation materials.
                  </p>
                )}
                {application.status === "offered" && (
                  <p className="text-gray-700 dark:text-gray-300">
                    We've extended an offer! Check your email for the offer letter
                    and next steps to join our team.
                  </p>
                )}
                {application.status === "hired" && (
                  <p className="text-gray-700 dark:text-gray-300">
                    Welcome to the team! Check your email for onboarding
                    instructions and your start date.
                  </p>
                )}
                {application.status === "rejected" && (
                  <p className="text-gray-700 dark:text-gray-300">
                    While we won't be moving forward with your application at this
                    time, we appreciate your interest and encourage you to apply
                    for other positions that match your skills.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <span className="text-lg">💡</span>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Bookmark this page or save your tracking token to check your status anytime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Questions about your application? Contact us at{" "}
            <a
              href="mailto:hr@company.com"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              hr@company.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
