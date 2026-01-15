"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  CheckCircle2,
  Mail,
  FileText,
  Briefcase,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const token = searchParams.get("token");
  const jobTitle = searchParams.get("jobTitle");
  const email = searchParams.get("email");
  const matchScore = searchParams.get("matchScore");

  useEffect(() => {
    // If no token, redirect to jobs page
    if (!token) {
      router.push("/jobs");
    }
  }, [token, router]);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Token copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) {
    return null;
  }

  const hasValidMatchScore = matchScore && matchScore !== "undefined" && matchScore !== "null" && !isNaN(parseInt(matchScore));

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 shadow-lg shadow-green-200 dark:shadow-green-900/50">
            <CheckCircle2 className="h-14 w-14 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Application Submitted!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your application has been successfully received.
          </p>
        </div>

        {/* Application Details Card */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Application Details
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              We&apos;ve received your application for the following position:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Position
              </label>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {jobTitle || "Job Position"}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email Address
              </label>
              <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {email}
              </p>
            </div>

            {hasValidMatchScore ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  AI Match Score
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <Badge
                    variant={
                      parseInt(matchScore) >= 70
                        ? "default"
                        : parseInt(matchScore) >= 50
                        ? "secondary"
                        : "outline"
                    }
                    className={`text-lg px-4 py-2 ${
                      parseInt(matchScore) >= 70
                        ? "bg-green-600 hover:bg-green-700"
                        : parseInt(matchScore) >= 50
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : ""
                    }`}
                  >
                    {matchScore}% Match
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {parseInt(matchScore) >= 70
                      ? "Excellent match!"
                      : parseInt(matchScore) >= 50
                      ? "Good match"
                      : "Your application is being reviewed"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
            )}
          </CardContent>
        </Card>

        {/* Tracking Token Card */}
        <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <FileText className="h-5 w-5" />
              Application Tracking Token
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Save this token to check your application status anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-700">
              <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                {token}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToken}
                className="shrink-0 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-start gap-2 mt-4 p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-lg">💡</span>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Bookmark the status page or save this token to track your application progress.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shadow-sm">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Application Review
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Our AI system will analyze your resume and match it with the job requirements.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shadow-sm">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">HR Screening</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    If shortlisted, you&apos;ll receive an email invitation for the next round (assessment or interview).
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shadow-sm">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Stay Updated</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Check your application status anytime using your tracking token.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg" className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            <Link href={`/status/${token}`}>
              <FileText className="mr-2 h-4 w-4" />
              Check Application Status
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              Browse More Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Questions? Contact us at{" "}
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
