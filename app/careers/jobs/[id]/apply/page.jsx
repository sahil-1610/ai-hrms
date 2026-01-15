"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Loader2,
  Upload,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
  Building2,
  MapPin,
  Clock,
  Send,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileEdit,
} from "lucide-react";

export default function CareersApplyPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentCompany: "",
    experience: "",
    skills: "",
    education: "",
    coverLetter: "",
  });

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

  const primaryColor = settings?.primary_color || "#3B82F6";
  const secondaryColor = settings?.secondary_color || "#8B5CF6";

  const handleFileChange = async (e) => {
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
    await parseResume(file);
  };

  const parseResume = async (file) => {
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse resume");
      }

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        currentCompany: data.currentCompany || prev.currentCompany,
        experience: data.experience?.toString() || prev.experience,
        skills: data.skills?.join(", ") || prev.skills,
        education: data.education || prev.education,
      }));

      toast.success(
        "Resume parsed successfully! Please review and edit the details."
      );
    } catch (error) {
      console.error("Error parsing resume:", error);
      toast.error(
        error.message || "Failed to parse resume. Please fill the form manually."
      );
    } finally {
      setParsing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !resumeFile) {
      toast.error("Please fill in all required fields and upload your resume");
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
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      const response = await fetch(`/api/jobs/${params.id}/apply`, {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully!");

      const successUrl = `/careers/jobs/${params.id}/apply/success?token=${
        data.application.token
      }&jobTitle=${encodeURIComponent(
        data.application.jobTitle
      )}&email=${encodeURIComponent(data.application.email)}&matchScore=${
        data.application.matchScore
      }`;
      router.push(successUrl);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings?.background_color || "#F9FAFB" }}
    >
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
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
              href={`/careers/jobs/${job.id}`}
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
        className="relative py-12 px-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/careers/jobs/${job.id}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to job details
          </Link>
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
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {job.experience_min}-{job.experience_max} years
            </span>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Upload */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Upload className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Resume
                </h2>
                <p className="text-sm text-gray-500">
                  Our AI will automatically parse your resume and fill in the form
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="resume"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={parsing || submitting}
              />
              <label htmlFor="resume" className="cursor-pointer">
                {parsing ? (
                  <div className="space-y-3">
                    <Loader2
                      className="mx-auto h-12 w-12 animate-spin"
                      style={{ color: primaryColor }}
                    />
                    <p className="text-sm font-medium text-gray-700">
                      Parsing your resume...
                    </p>
                    <p className="text-xs text-gray-500">
                      This may take a few seconds
                    </p>
                  </div>
                ) : resumeFile ? (
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
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
                    >
                      Change File
                    </button>
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

            {resumeFile && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl mt-4"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <Sparkles className="h-5 w-5 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                <div className="text-sm">
                  <p className="font-medium" style={{ color: primaryColor }}>
                    AI Auto-fill Complete
                  </p>
                  <p className="text-gray-600">
                    Please review and edit the information below before submitting
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <User className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
                <p className="text-sm text-gray-500">
                  Fields marked with * are required
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <Briefcase className="h-5 w-5" style={{ color: secondaryColor }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Professional Information
                </h2>
                <p className="text-sm text-gray-500">
                  Tell us about your experience
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="currentCompany"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Company
                </label>
                <input
                  type="text"
                  id="currentCompany"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700"
                >
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label
                htmlFor="skills"
                className="block text-sm font-medium text-gray-700"
              >
                Skills (comma-separated)
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                placeholder="e.g., React, Node.js, Python"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-4 space-y-2">
              <label
                htmlFor="education"
                className="block text-sm font-medium text-gray-700"
              >
                <GraduationCap className="inline h-4 w-4 mr-1" />
                Education
              </label>
              <textarea
                id="education"
                name="education"
                placeholder="e.g., B.Tech in Computer Science, XYZ University (2020)"
                value={formData.education}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <FileEdit className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cover Letter (Optional)
                </h2>
                <p className="text-sm text-gray-500">
                  Tell us why you&apos;re a great fit for this role
                </p>
              </div>
            </div>

            <textarea
              id="coverLetter"
              name="coverLetter"
              placeholder="Write your cover letter here..."
              value={formData.coverLetter}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <Link
              href={`/careers/jobs/${job.id}`}
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
                <>
                  <Send className="h-5 w-5" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
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
