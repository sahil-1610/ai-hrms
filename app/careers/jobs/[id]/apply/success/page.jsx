"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  FileText,
  Briefcase,
  ArrowRight,
  Copy,
  Check,
  Building2,
  ArrowLeft,
  Clock,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function CareersApplicationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState(null);

  const token = searchParams.get("token");
  const jobTitle = searchParams.get("jobTitle");
  const email = searchParams.get("email");
  const matchScore = searchParams.get("matchScore");

  useEffect(() => {
    if (!token) {
      router.push("/careers");
    }
    fetchSettings();
  }, [token, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/company/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const primaryColor = settings?.primary_color || "#3B82F6";
  const secondaryColor = settings?.secondary_color || "#8B5CF6";

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
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings?.background_color || "#F9FAFB" }}
    >
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.company_name}
                  className="h-10 object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
              )}
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {settings?.company_name || "Company"}
              </span>
            </div>
            <Link
              href="/careers"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Careers
            </Link>
          </div>
        </div>
      </nav>

      {/* Success Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CheckCircle2 className="h-14 w-14" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Application Submitted!
          </h1>
          <p className="text-lg text-gray-600">
            Your application has been successfully received. We&apos;ll be in touch soon.
          </p>
        </div>

        {/* Application Details Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Briefcase className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Application Details
              </h2>
              <p className="text-sm text-gray-500">
                We&apos;ve received your application for the following position
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
              <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="text-lg font-semibold text-gray-900">
                  {jobTitle || "Job Position"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
            </div>

            {matchScore && matchScore !== "undefined" && matchScore !== "null" && matchScore !== "0" && parseInt(matchScore) > 0 ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                <UserCheck className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Initial Match Score</p>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1"
                    style={{
                      backgroundColor:
                        parseInt(matchScore) >= 70
                          ? "#DEF7EC"
                          : parseInt(matchScore) >= 50
                          ? "#FEF3C7"
                          : "#FEE2E2",
                      color:
                        parseInt(matchScore) >= 70
                          ? "#03543F"
                          : parseInt(matchScore) >= 50
                          ? "#92400E"
                          : "#991B1B",
                    }}
                  >
                    {matchScore}% Match
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on AI analysis of your resume
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Resume Analysis</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 bg-blue-100 text-blue-800">
                    Pending Review
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Your resume will be analyzed by our HR team
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Token Card */}
        <div
          className="rounded-2xl shadow-sm p-6 border mb-6"
          style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}30` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <FileText className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Application Tracking Token
              </h2>
              <p className="text-sm text-gray-600">
                Save this token to check your application status anytime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border">
            <code className="flex-1 text-sm font-mono text-gray-800 break-all">
              {token}
            </code>
            <button
              onClick={copyToken}
              className="shrink-0 p-2 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>
          <p className="text-sm mt-3" style={{ color: primaryColor }}>
            💡 Tip: Bookmark the status page or save this token to track your
            application progress.
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            What Happens Next?
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Application Review</h3>
                <p className="text-sm text-gray-600">
                  Our AI system will analyze your resume and match it with the job
                  requirements.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">HR Screening</h3>
                <p className="text-sm text-gray-600">
                  If shortlisted, you&apos;ll receive an email invitation for the next
                  round (assessment or interview).
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stay Updated</h3>
                <p className="text-sm text-gray-600">
                  Check your application status anytime using your tracking token.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/status/${token}`}
            className="flex items-center justify-center gap-2 px-6 py-3 border rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <ClipboardCheck className="h-5 w-5" />
            Check Application Status
          </Link>
          <Link
            href="/careers"
            className="flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            <Briefcase className="h-5 w-5" />
            Browse More Jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Questions? Contact us at{" "}
            <a
              href={`mailto:${settings?.contact_email || "hr@company.com"}`}
              className="hover:underline"
              style={{ color: primaryColor }}
            >
              {settings?.contact_email || "hr@company.com"}
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {settings?.company_name || "Company"}. All
            rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">Powered by AI-HRMS</p>
        </div>
      </footer>
    </div>
  );
}
