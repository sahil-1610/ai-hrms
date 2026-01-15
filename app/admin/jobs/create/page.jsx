"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  MapPin,
  Briefcase,
  DollarSign,
  Loader2,
  FileText,
  CheckCircle2,
  Zap,
  Users,
} from "lucide-react";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    experienceMin: "",
    experienceMax: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    description: "",
    numberOfPositions: "1",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateJD = async () => {
    if (
      !formData.title ||
      !formData.location ||
      !formData.experienceMin ||
      !formData.experienceMax
    ) {
      toast.error("Please fill in title, location, and experience range first");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/jobs/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          experienceMin: parseInt(formData.experienceMin),
          experienceMax: parseInt(formData.experienceMax),
          skills: formData.skills
            ? formData.skills.split(",").map((s) => s.trim())
            : [],
          salaryMin: formData.salaryMin
            ? parseFloat(formData.salaryMin)
            : undefined,
          salaryMax: formData.salaryMax
            ? parseFloat(formData.salaryMax)
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate job description";
        if (data.missingFields) {
          toast.error(`Missing fields: ${data.missingFields.join(", ")}`);
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      setFormData((prev) => ({ ...prev, description: data.description }));
      toast.success("Job description generated successfully!");
    } catch (error) {
      console.error("Error generating JD:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (status) => {
    if (
      !formData.title ||
      !formData.location ||
      !formData.description ||
      !formData.experienceMin ||
      !formData.experienceMax
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const expMin = parseInt(formData.experienceMin);
    const expMax = parseInt(formData.experienceMax);
    if (expMin < 0 || expMax < expMin) {
      toast.error("Please enter a valid experience range");
      return;
    }

    if (formData.salaryMin && formData.salaryMax) {
      const salMin = parseFloat(formData.salaryMin);
      const salMax = parseFloat(formData.salaryMax);
      if (salMax < salMin) {
        toast.error("Maximum salary must be greater than minimum salary");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          experienceMin: expMin,
          experienceMax: expMax,
          salaryMin: formData.salaryMin
            ? parseFloat(formData.salaryMin)
            : undefined,
          salaryMax: formData.salaryMax
            ? parseFloat(formData.salaryMax)
            : undefined,
          skills: formData.skills
            ? formData.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          numberOfPositions: parseInt(formData.numberOfPositions) || 1,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to create job";
        if (data.missingFields) {
          toast.error(`Please fill in: ${data.missingFields.join(", ")}`);
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      toast.success(
        `Job ${status === "active" ? "published" : "saved as draft"} successfully!`
      );
      router.push("/admin/jobs");
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.location && formData.experienceMin && formData.experienceMax;
  const isReadyToSubmit = isFormValid && formData.description;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-4 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Job
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Fill in the details or use AI to generate a professional job description
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!formData.title}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={loading || !isReadyToSubmit}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit("active")}
              disabled={loading || !isReadyToSubmit}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Publish Job
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="shadow-lg border-0 dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                    <CardDescription>Essential details about the position</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Senior Full Stack Developer"
                    value={formData.title}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., San Francisco, CA (Remote)"
                      value={formData.location}
                      onChange={handleChange}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceMin" className="text-sm font-medium">
                      Min Experience <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="experienceMin"
                        name="experienceMin"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.experienceMin}
                        onChange={handleChange}
                        className="h-11 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">years</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceMax" className="text-sm font-medium">
                      Max Experience <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="experienceMax"
                        name="experienceMax"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={formData.experienceMax}
                        onChange={handleChange}
                        className="h-11 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">years</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPositions" className="text-sm font-medium">
                    Number of Positions
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="numberOfPositions"
                      name="numberOfPositions"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.numberOfPositions}
                      onChange={handleChange}
                      className="h-11 pl-10 w-32"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    How many candidates you plan to hire for this role
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin" className="text-sm font-medium">Min Salary</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="salaryMin"
                        name="salaryMin"
                        type="number"
                        min="0"
                        placeholder="80,000"
                        value={formData.salaryMin}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax" className="text-sm font-medium">Max Salary</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="salaryMax"
                        name="salaryMax"
                        type="number"
                        min="0"
                        placeholder="120,000"
                        value={formData.salaryMax}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-medium">Required Skills</Label>
                  <Input
                    id="skills"
                    name="skills"
                    placeholder="React, Node.js, PostgreSQL (comma-separated)"
                    value={formData.skills}
                    onChange={handleChange}
                    className="h-11"
                  />
                  {formData.skills && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="shadow-lg border-0 dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Job Description</CardTitle>
                      <CardDescription>Detailed description of the role</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a detailed job description or use AI to generate one..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={16}
                  className="font-mono text-sm resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tip: Include responsibilities, qualifications, and what makes this role exciting
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Assistant */}
          <div className="space-y-6">
            {/* AI Generator Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white sticky top-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">AI Job Description</CardTitle>
                    <CardDescription className="text-white/80">
                      Generate professional content instantly
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/90">
                  Fill in the basic details above and let AI create a compelling,
                  professional job description tailored to your needs.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Industry-standard formatting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>SEO-optimized content</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Customizable output</span>
                  </div>
                </div>
                <Separator className="bg-white/20" />
                <Button
                  onClick={handleGenerateJD}
                  disabled={generating || !isFormValid}
                  className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold h-12"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate with AI
                    </>
                  )}
                </Button>
                {!isFormValid && (
                  <p className="text-xs text-white/70 text-center">
                    Fill in title, location, and experience to enable AI generation
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="shadow-lg border-0 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tips for Great Job Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  <span>Use clear, specific job titles that candidates search for</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  <span>Include salary ranges to attract more qualified applicants</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">3.</span>
                  <span>List must-have skills separately from nice-to-haves</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">4.</span>
                  <span>Highlight unique perks and company culture</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Preview</DialogTitle>
            <DialogDescription>
              This is how candidates will see this job posting
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {formData.title || "Job Title"}
                    </CardTitle>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {formData.location || "Location"}
                      </span>
                      <span className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {formData.experienceMin && formData.experienceMax
                          ? `${formData.experienceMin}-${formData.experienceMax} years`
                          : "Experience required"}
                      </span>
                      {(formData.salaryMin || formData.salaryMax) && (
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formData.salaryMin && formData.salaryMax
                            ? `$${parseInt(formData.salaryMin).toLocaleString()} - $${parseInt(formData.salaryMax).toLocaleString()}`
                            : formData.salaryMin
                            ? `From $${parseInt(formData.salaryMin).toLocaleString()}`
                            : `Up to $${parseInt(formData.salaryMax).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.description ? (
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Job Description</h3>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {formData.description}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No description provided
                    </p>
                  )}

                  {formData.skills && (
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button className="w-full" disabled>
                      Apply Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
