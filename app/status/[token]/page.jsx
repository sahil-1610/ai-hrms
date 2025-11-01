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
} from "lucide-react";

const statusConfig = {
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800",
    icon: FileText,
    description: "Your application has been received and is under review",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    description: "Great news! You've been shortlisted for the next round",
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description:
      "Thank you for your interest. Unfortunately, we're moving forward with other candidates",
  },
  interviewing: {
    label: "Interviewing",
    color: "bg-purple-100 text-purple-800",
    icon: Clock,
    description:
      "You're in the interview stage. Check your email for next steps",
  },
  offered: {
    label: "Offer Extended",
    color: "bg-yellow-100 text-yellow-800",
    icon: Award,
    description: "Congratulations! We've extended an offer. Check your email",
  },
  hired: {
    label: "Hired",
    color: "bg-green-100 text-green-800",
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-center">Application Not Found</CardTitle>
            <CardDescription className="text-center">
              {error ||
                "We couldn't find an application with this tracking token."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Application Status
          </h1>
          <p className="text-gray-600 mt-2">Track your application progress</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.color}`}
                  >
                    <StatusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Current Status: {statusInfo.label}</CardTitle>
                    <CardDescription>{statusInfo.description}</CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Application Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Position
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {job.title}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Building2 className="h-4 w-4" />
                  {job.location}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Applicant Name
                </label>
                <p className="text-gray-900">{application.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900">{application.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-gray-900">{application.phone}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Applied On
                </label>
                <p className="text-gray-900">
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
              application.resume_match_score !== undefined && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Match Score
                    </label>
                    <div className="mt-2">
                      <Badge
                        variant={
                          application.resume_match_score >= 70
                            ? "default"
                            : application.resume_match_score >= 50
                            ? "secondary"
                            : "outline"
                        }
                        className="text-lg px-4 py-1"
                      >
                        {application.resume_match_score}% Match
                      </Badge>
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {application.status === "submitted" && (
                <p className="text-gray-700">
                  Your application is being reviewed by our hiring team. We'll
                  notify you via email if you're shortlisted for the next round.
                </p>
              )}
              {application.status === "shortlisted" && (
                <p className="text-gray-700">
                  Congratulations! You've been shortlisted. Check your email for
                  next steps, which may include an assessment or interview
                  invitation.
                </p>
              )}
              {application.status === "interviewing" && (
                <p className="text-gray-700">
                  You're in the interview stage. Please check your email for
                  interview scheduling details and preparation materials.
                </p>
              )}
              {application.status === "offered" && (
                <p className="text-gray-700">
                  We've extended an offer! Check your email for the offer letter
                  and next steps to join our team.
                </p>
              )}
              {application.status === "hired" && (
                <p className="text-gray-700">
                  Welcome to the team! Check your email for onboarding
                  instructions and your start date.
                </p>
              )}
              {application.status === "rejected" && (
                <p className="text-gray-700">
                  While we won't be moving forward with your application at this
                  time, we appreciate your interest and encourage you to apply
                  for other positions that match your skills.
                </p>
              )}

              <p className="text-sm text-gray-600 mt-4">
                💡 Tip: Bookmark this page or save your tracking token to check
                your status anytime.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Questions about your application? Contact us at{" "}
            <a
              href="mailto:hr@company.com"
              className="text-blue-600 hover:underline"
            >
              hr@company.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
