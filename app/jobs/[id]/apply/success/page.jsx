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

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h1>
          <p className="text-lg text-gray-600">
            Your application has been successfully received.
          </p>
        </div>

        {/* Application Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Application Details
            </CardTitle>
            <CardDescription>
              We&apos;ve received your application for the following position:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Position
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {jobTitle || "Job Position"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {email}
              </p>
            </div>

            {matchScore && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Initial Match Score
                </label>
                <div className="mt-1">
                  <Badge
                    variant={
                      parseInt(matchScore) >= 70
                        ? "default"
                        : parseInt(matchScore) >= 50
                        ? "secondary"
                        : "outline"
                    }
                    className="text-lg px-4 py-1"
                  >
                    {matchScore}% Match
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Token Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="h-5 w-5" />
              Application Tracking Token
            </CardTitle>
            <CardDescription className="text-blue-700">
              Save this token to check your application status anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
              <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                {token}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToken}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-blue-700 mt-3">
              💡 Tip: Bookmark the status page or save this token to track your
              application progress.
            </p>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Application Review
                  </h3>
                  <p className="text-sm text-gray-600">
                    Our AI system will analyze your resume and match it with the
                    job requirements.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">HR Screening</h3>
                  <p className="text-sm text-gray-600">
                    If shortlisted, you&apos;ll receive an email invitation for
                    the next round (assessment or interview).
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Stay Updated</h3>
                  <p className="text-sm text-gray-600">
                    Check your application status anytime using your tracking
                    token.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href={`/status/${token}`}>
              <FileText className="mr-2 h-4 w-4" />
              Check Application Status
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              Browse More Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Questions? Contact us at{" "}
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
