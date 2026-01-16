"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  FileText,
  Check,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Mail,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Error types for better UX
const ERROR_TYPES = {
  DUPLICATE_APPLICATION: "duplicate_application",
  JOB_CLOSED: "job_closed",
  UPLOAD_FAILED: "upload_failed",
  SERVER_ERROR: "server_error",
};

function getErrorType(errorMessage) {
  const msg = errorMessage?.toLowerCase() || "";
  if (msg.includes("already applied") || msg.includes("duplicate")) {
    return ERROR_TYPES.DUPLICATE_APPLICATION;
  }
  if (msg.includes("no longer accepting") || msg.includes("closed")) {
    return ERROR_TYPES.JOB_CLOSED;
  }
  if (msg.includes("upload") || msg.includes("resume")) {
    return ERROR_TYPES.UPLOAD_FAILED;
  }
  return ERROR_TYPES.SERVER_ERROR;
}

function ErrorDialog({ open, onClose, errorType, errorMessage, email, jobTitle, onRetry }) {
  const getContent = () => {
    switch (errorType) {
      case ERROR_TYPES.DUPLICATE_APPLICATION:
        return {
          icon: <Mail className="h-12 w-12 text-amber-500" />,
          title: "Application Already Submitted",
          description: (
            <>
              <p className="mb-3">
                You have already applied for <strong>{jobTitle}</strong> using:
              </p>
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-center mb-3">
                <span className="font-medium">{email}</span>
              </div>
              <p className="text-sm text-gray-500">
                Our team is reviewing your application. You will receive an email update.
              </p>
            </>
          ),
          action: { label: "Got it", onClick: onClose },
        };
      case ERROR_TYPES.JOB_CLOSED:
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Position No Longer Available",
          description: <p>This position is no longer accepting applications.</p>,
          action: { label: "Close", onClick: onClose },
        };
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-orange-500" />,
          title: "Something Went Wrong",
          description: <p>{errorMessage || "Please try again later."}</p>,
          action: { label: "Try Again", onClick: onRetry },
        };
    }
  };

  const content = getContent();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">{content.icon}</div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-left mt-4">{content.description}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={content.action.onClick} className="w-full">
            {content.action.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Embeddable Job Application Form
 *
 * This page is designed to be embedded in an iframe on external websites.
 * It's a standalone, self-contained application form without navigation elements.
 *
 * Usage:
 *   <iframe
 *     src="https://your-domain.com/embed/apply/[job-id]"
 *     width="100%"
 *     height="800"
 *     frameborder="0"
 *   ></iframe>
 *
 * Optional query params:
 *   ?theme=light|dark - Force a theme
 *   ?hideHeader=true - Hide the job header
 */
function EmbedApplyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [errorDialog, setErrorDialog] = useState({ open: false, type: null, message: "" });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedIn: "",
    portfolio: "",
    coverLetter: "",
  });

  const hideHeader = searchParams.get("hideHeader") === "true";
  const theme = searchParams.get("theme") || "light";

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setResumeFile(file);
    toast.success("Resume uploaded");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !resumeFile) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("resume", resumeFile);
      submitData.append("name", `${formData.firstName} ${formData.lastName}`);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("linkedIn", formData.linkedIn);
      submitData.append("portfolio", formData.portfolio);
      submitData.append("coverLetter", formData.coverLetter);

      const response = await fetch(`/api/jobs/${params.id}/apply`, {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to submit application";
        setErrorDialog({
          open: true,
          type: getErrorType(errorMessage),
          message: errorMessage,
        });
        return;
      }

      setMatchScore(data.application?.matchScore);
      setSubmitted(true);

      // Post message to parent window for iframe communication
      if (window.parent !== window) {
        window.parent.postMessage({
          type: "APPLICATION_SUBMITTED",
          jobId: params.id,
          email: formData.email,
          matchScore: data.application?.matchScore,
        }, "*");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setErrorDialog({
        open: true,
        type: ERROR_TYPES.SERVER_ERROR,
        message: error.message || "Failed to submit application",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <p className="text-gray-500">Job not found or no longer available.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for applying for <strong>{job.title}</strong>. We've received your application and will be in touch soon.
          </p>
          {matchScore !== null && matchScore !== undefined && (
            <div className="mb-4 p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm text-gray-500 mb-2">Initial Match Score</p>
              <span
                className="inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold"
                style={{
                  backgroundColor:
                    matchScore >= 70
                      ? "#DEF7EC"
                      : matchScore >= 50
                      ? "#FEF3C7"
                      : "#FEE2E2",
                  color:
                    matchScore >= 70
                      ? "#03543F"
                      : matchScore >= 50
                      ? "#92400E"
                      : "#991B1B",
                }}
              >
                {matchScore}% Match
              </span>
              <p className="text-xs text-gray-500 mt-2">
                Based on AI analysis of your resume
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to <strong>{formData.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {!hideHeader && (
        <div
          className="py-6 px-6"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.company_name}
                  className="h-8 object-contain bg-white/20 rounded px-2 py-1"
                />
              ) : (
                <Building2 className="h-6 w-6 text-white" />
              )}
              <span className="text-white font-medium">
                {settings?.company_name || "Company"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/80 text-sm">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              {job.department && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job.department}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn</Label>
                <Input
                  id="linkedIn"
                  name="linkedIn"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedIn}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio</Label>
                <Input
                  id="portfolio"
                  name="portfolio"
                  type="url"
                  placeholder="https://..."
                  value={formData.portfolio}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Resume <span className="text-red-500">*</span>
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="resume"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={submitting}
              />
              <label htmlFor="resume" className="cursor-pointer">
                {resumeFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-6 w-6 text-green-600" />
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload resume
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF or DOCX (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Cover Letter <span className="text-gray-400 text-sm font-normal">(Optional)</span>
            </h2>
            <Textarea
              id="coverLetter"
              name="coverLetter"
              placeholder="Tell us why you're interested in this role..."
              value={formData.coverLetter}
              onChange={handleChange}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || !resumeFile}
            size="lg"
            className="w-full"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By submitting, you agree to our privacy policy and terms of service.
          </p>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t mt-8">
        <p className="text-xs text-gray-400">
          Powered by AI-HRMS
        </p>
      </div>

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, type: null, message: "" })}
        errorType={errorDialog.type}
        errorMessage={errorDialog.message}
        email={formData.email}
        jobTitle={job?.title}
        onRetry={() => setErrorDialog({ open: false, type: null, message: "" })}
      />
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

// Main export with Suspense boundary
export default function EmbedApplyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmbedApplyContent />
    </Suspense>
  );
}
