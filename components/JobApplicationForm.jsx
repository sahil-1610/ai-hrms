"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Loader2,
  Upload,
  FileText,
  ArrowLeft,
  Check,
  Lightbulb,
  Target,
  Clock,
  FileCheck,
  Briefcase,
  Building2,
  MapPin,
  AlertCircle,
  XCircle,
  Mail,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// Error types for better UX
const ERROR_TYPES = {
  DUPLICATE_APPLICATION: "duplicate_application",
  JOB_CLOSED: "job_closed",
  UPLOAD_FAILED: "upload_failed",
  VALIDATION_ERROR: "validation_error",
  SERVER_ERROR: "server_error",
};

// Parse error message to determine error type
function getErrorType(errorMessage) {
  const msg = errorMessage?.toLowerCase() || "";
  if (msg.includes("already applied") || msg.includes("duplicate")) {
    return ERROR_TYPES.DUPLICATE_APPLICATION;
  }
  if (msg.includes("no longer accepting") || msg.includes("closed") || msg.includes("not active")) {
    return ERROR_TYPES.JOB_CLOSED;
  }
  if (msg.includes("upload") || msg.includes("resume")) {
    return ERROR_TYPES.UPLOAD_FAILED;
  }
  if (msg.includes("required") || msg.includes("invalid") || msg.includes("valid")) {
    return ERROR_TYPES.VALIDATION_ERROR;
  }
  return ERROR_TYPES.SERVER_ERROR;
}

// Error Dialog Component
function ErrorDialog({ open, onClose, errorType, errorMessage, email, jobTitle, onRetry }) {
  const getErrorContent = () => {
    switch (errorType) {
      case ERROR_TYPES.DUPLICATE_APPLICATION:
        return {
          icon: <Mail className="h-12 w-12 text-amber-500" />,
          title: "Application Already Submitted",
          description: (
            <>
              <p className="mb-3">
                You have already applied for <strong>{jobTitle}</strong> using this email address:
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-center mb-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
              </div>
              <p className="text-sm text-gray-500">
                Our team is reviewing your application. You will receive an email update on your application status.
              </p>
            </>
          ),
          primaryAction: { label: "Got it", onClick: onClose },
          secondaryAction: null,
        };
      case ERROR_TYPES.JOB_CLOSED:
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Position No Longer Available",
          description: (
            <p>
              Sorry, this position is no longer accepting applications. Please check our careers page for other opportunities.
            </p>
          ),
          primaryAction: { label: "Browse Other Jobs", onClick: () => window.location.href = "/careers" },
          secondaryAction: { label: "Close", onClick: onClose },
        };
      case ERROR_TYPES.UPLOAD_FAILED:
        return {
          icon: <AlertCircle className="h-12 w-12 text-orange-500" />,
          title: "Resume Upload Failed",
          description: (
            <p>
              We couldn't upload your resume. Please try again with a different file or check your internet connection.
            </p>
          ),
          primaryAction: { label: "Try Again", onClick: onRetry },
          secondaryAction: { label: "Close", onClick: onClose },
        };
      case ERROR_TYPES.VALIDATION_ERROR:
        return {
          icon: <AlertCircle className="h-12 w-12 text-amber-500" />,
          title: "Please Check Your Information",
          description: <p>{errorMessage}</p>,
          primaryAction: { label: "Fix & Retry", onClick: onClose },
          secondaryAction: null,
        };
      default:
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Something Went Wrong",
          description: (
            <p>
              {errorMessage || "An unexpected error occurred. Please try again later or contact support if the problem persists."}
            </p>
          ),
          primaryAction: { label: "Try Again", onClick: onRetry },
          secondaryAction: { label: "Close", onClick: onClose },
        };
    }
  };

  const content = getErrorContent();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-left mt-4">
              {content.description}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          {content.secondaryAction && (
            <Button variant="outline" onClick={content.secondaryAction.onClick} className="w-full sm:w-auto">
              {content.secondaryAction.label}
            </Button>
          )}
          <Button onClick={content.primaryAction.onClick} className="w-full sm:w-auto">
            {content.primaryAction.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationTips({ variant = "default" }) {
  const isEmbedded = variant === "embedded";

  return (
    <div className="space-y-6">
      {/* Tips Card */}
      <Card className={`${isEmbedded ? "border-2" : ""} dark:bg-gray-800 dark:border-gray-700 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100 text-lg">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Application Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <FileCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Update your resume</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Make sure your resume is up-to-date and tailored to this role.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Highlight relevant skills</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Focus on skills and experiences that match the job requirements.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Apply early</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Early applications often get more attention from recruiters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Letter Tips */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-lg">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Cover Letter Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            A great cover letter should:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span>Explain why you're interested in this role</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span>Highlight 2-3 relevant achievements</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span>Show you've researched the company</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span>Keep it concise (250-400 words)</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-lg">
            <Briefcase className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                1
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">Application Review</p>
                <p className="text-gray-500 dark:text-gray-400">We'll review your application</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                2
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">Initial Screening</p>
                <p className="text-gray-500 dark:text-gray-400">Quick assessment call</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                3
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">Technical Interview</p>
                <p className="text-gray-500 dark:text-gray-400">Skills & experience deep dive</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                4
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">Final Decision</p>
                <p className="text-gray-500 dark:text-gray-400">Offer or feedback</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Shared Job Application Form component
 * @param {Object} props
 * @param {Object} props.job - Job object with id, title, location, department, type, etc.
 * @param {Object} props.settings - Company settings (optional, for branded careers page)
 * @param {string} props.variant - "default" | "embedded" - controls styling
 * @param {string} props.successRedirect - URL pattern for success page (with {id} placeholder)
 * @param {string} props.backUrl - URL for back button
 */
export default function JobApplicationForm({
  job,
  settings = null,
  variant = "default",
  successRedirect = "/jobs/{id}/apply/success",
  backUrl = null
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    type: null,
    message: "",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedIn: "",
    portfolio: "",
    coverLetter: "",
  });

  const isEmbedded = variant === "embedded";
  const primaryColor = settings?.primary_color || "#3B82F6";
  const secondaryColor = settings?.secondary_color || "#8B5CF6";
  const defaultBackUrl = backUrl || (isEmbedded ? `/careers/jobs/${job?.id}` : `/jobs/${job?.id}`);

  const closeErrorDialog = () => {
    setErrorDialog({ open: false, type: null, message: "" });
  };

  const handleRetry = () => {
    closeErrorDialog();
    // Let user try again - form data is preserved
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setResumeFile(file);
    toast.success("Resume uploaded successfully");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !resumeFile) {
      toast.error("Please fill in all required fields and upload your resume");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("resume", resumeFile);
      submitData.append("name", `${formData.firstName} ${formData.lastName}`);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("linkedIn", formData.linkedIn);
      submitData.append("portfolio", formData.portfolio);
      submitData.append("coverLetter", formData.coverLetter);

      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to submit application";
        const errorType = getErrorType(errorMessage);

        // Show error dialog instead of toast for important errors
        setErrorDialog({
          open: true,
          type: errorType,
          message: errorMessage,
        });
        return;
      }

      toast.success("Application submitted successfully!");

      // Redirect to success page with application details
      const successUrl = successRedirect.replace("{id}", job.id) +
        `?token=${data.application.token}&jobTitle=${encodeURIComponent(
          data.application.jobTitle
        )}&email=${encodeURIComponent(data.application.email)}&matchScore=${
          data.application.matchScore || 0
        }`;
      router.push(successUrl);
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

  if (!job) {
    return null;
  }

  // Error Dialog - shared between both variants
  const errorDialogComponent = (
    <ErrorDialog
      open={errorDialog.open}
      onClose={closeErrorDialog}
      errorType={errorDialog.type}
      errorMessage={errorDialog.message}
      email={formData.email}
      jobTitle={job.title}
      onRetry={handleRetry}
    />
  );

  // Embedded variant - for careers page with company branding
  if (isEmbedded) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: settings?.background_color || "#F9FAFB" }}
      >
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
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
                href={defaultBackUrl}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Job
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div
          className="relative py-10 px-4"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Apply for {job.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/90 text-sm">
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
              {(job.experience_min || job.experience_max) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.experience_min}-{job.experience_max} years
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Application Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Fields marked with * are required
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-800">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="border-2 border-gray-300 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-800">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="border-2 border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-800">
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
                          className="border-2 border-gray-300 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-800">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="linkedIn" className="text-gray-800">
                          LinkedIn Profile
                        </Label>
                        <Input
                          id="linkedIn"
                          name="linkedIn"
                          type="url"
                          placeholder="https://linkedin.com/in/johndoe"
                          value={formData.linkedIn}
                          onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio" className="text-gray-800">
                          Portfolio / Website
                        </Label>
                        <Input
                          id="portfolio"
                          name="portfolio"
                          type="url"
                          placeholder="https://johndoe.com"
                          value={formData.portfolio}
                          onChange={handleChange}
                          className="border-2 border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Resume <span className="text-red-500">*</span>
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload your most recent resume (PDF or DOCX, max 10MB)
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
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
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600 mr-2" />
                            <FileText className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {resumeFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(resumeFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button type="button" variant="outline" size="sm">
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF or DOCX (max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Cover Letter
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Tell us why you're interested in this role
                  </p>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    placeholder="I'm excited to apply for this position because..."
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows={6}
                    className="border-2 border-gray-300 rounded-xl resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.coverLetter.length} / 2000 characters
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <Link
                    href={defaultBackUrl}
                    className="px-6 py-3 text-gray-700 font-medium border rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || !resumeFile}
                    className="flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side - Tips */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ApplicationTips variant="embedded" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t py-6 mt-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} {settings?.company_name || "Company"}. All rights reserved.
            </p>
            <p className="text-gray-400 text-xs mt-2">Powered by AI-HRMS</p>
          </div>
        </footer>

        {/* Error Dialog */}
        {errorDialogComponent}
      </div>
    );
  }

  // Default variant - for internal jobs page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={defaultBackUrl}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job Details
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Apply for {job.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job.department || "Engineering"}
                </span>
                <span>{job.location}</span>
                <span>{job.type || "Full-time"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Application Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Personal Information</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Fields marked with * are required
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="dark:text-gray-200">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="dark:text-gray-200">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-200">
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
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="dark:text-gray-200">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="linkedIn" className="dark:text-gray-200">
                        LinkedIn Profile
                      </Label>
                      <Input
                        id="linkedIn"
                        name="linkedIn"
                        type="url"
                        placeholder="https://linkedin.com/in/johndoe"
                        value={formData.linkedIn}
                        onChange={handleChange}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio" className="dark:text-gray-200">
                        Portfolio / Website
                      </Label>
                      <Input
                        id="portfolio"
                        name="portfolio"
                        type="url"
                        placeholder="https://johndoe.com"
                        value={formData.portfolio}
                        onChange={handleChange}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resume Upload */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">
                    Resume <span className="text-red-500">*</span>
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Upload your most recent resume (PDF or DOCX, max 10MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
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
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600 mr-2" />
                            <FileText className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {resumeFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(resumeFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button type="button" variant="outline" size="sm">
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PDF or DOCX (max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Letter */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Cover Letter</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Tell us why you're interested in this role and what makes you a great fit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    placeholder="I'm excited to apply for this position because..."
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows={8}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formData.coverLetter.length} / 2000 characters
                  </p>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !resumeFile}
                  size="lg"
                  className="px-8"
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
              </div>
            </form>
          </div>

          {/* Right Side - Tips and Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ApplicationTips />
            </div>
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      {errorDialogComponent}
    </div>
  );
}
