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
import {
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  MapPin,
  Briefcase,
  DollarSign,
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateJD = async () => {
    // Validate required fields for generation
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
        // Show specific error message from API
        const errorMessage = data.error || "Failed to generate job description";
        if (data.missingFields) {
          toast.error(`Missing fields: ${data.missingFields.join(", ")}`);
        } else if (data.field) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      setFormData((prev) => ({ ...prev, description: data.description }));
      toast.success("Job description generated successfully!");
    } catch (error) {
      console.error("Error generating JD:", error);
      // Error already shown via toast in the response check above
      if (!error.message.includes("Failed to generate")) {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (status) => {
    // Validate required fields
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

    // Validate experience range
    const expMin = parseInt(formData.experienceMin);
    const expMax = parseInt(formData.experienceMax);
    if (expMin < 0 || expMax < expMin) {
      toast.error("Please enter a valid experience range");
      return;
    }

    // Validate salary range if provided
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
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error message from API
        const errorMessage = data.error || "Failed to create job";

        if (data.missingFields) {
          toast.error(`Please fill in: ${data.missingFields.join(", ")}`);
        } else if (data.field === "experience") {
          toast.error(errorMessage, { duration: 4000 });
        } else if (data.field === "salary") {
          toast.error(errorMessage, { duration: 4000 });
        } else if (response.status === 403) {
          toast.error("You don't have permission to create jobs");
        } else if (response.status === 409) {
          toast.error(errorMessage, { duration: 5000 });
        } else if (response.status === 503) {
          toast.error(
            "AI service is temporarily unavailable. Please try again later.",
            {
              duration: 5000,
            }
          );
        } else {
          toast.error(errorMessage);
        }

        throw new Error(errorMessage);
      }

      toast.success(
        `Job ${
          status === "active" ? "published" : "saved as draft"
        } successfully!`
      );
      router.push("/admin/jobs");
    } catch (error) {
      console.error("Error creating job:", error);
      // Error already shown via toast in the response check above
      // Only show generic error if no specific error was shown
      if (!error.message || error.message === "Failed to create job") {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Job Posting
          </h1>
          <p className="text-gray-600 mt-1">
            Fill in the details or let AI generate a job description
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Enter the basic information about the position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Senior Full Stack Developer"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., San Francisco, CA (Remote)"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {/* Experience Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceMin">
                Min Experience (years) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="experienceMin"
                name="experienceMin"
                type="number"
                min="0"
                placeholder="0"
                value={formData.experienceMin}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceMax">
                Max Experience (years) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="experienceMax"
                name="experienceMax"
                type="number"
                min="0"
                placeholder="5"
                value={formData.experienceMax}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Min Salary ($)</Label>
              <Input
                id="salaryMin"
                name="salaryMin"
                type="number"
                min="0"
                placeholder="80000"
                value={formData.salaryMin}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">Max Salary ($)</Label>
              <Input
                id="salaryMax"
                name="salaryMax"
                type="number"
                min="0"
                placeholder="120000"
                value={formData.salaryMax}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills</Label>
            <Input
              id="skills"
              name="skills"
              placeholder="e.g., React, Node.js, PostgreSQL (comma-separated)"
              value={formData.skills}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">
              Enter skills separated by commas
            </p>
          </div>

          {/* AI Generate Button */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                AI-Powered Job Description
              </p>
              <p className="text-xs text-gray-600">
                Let AI generate a professional job description based on your
                inputs
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGenerateJD}
              disabled={
                generating ||
                !formData.title ||
                !formData.location ||
                !formData.experienceMin ||
                !formData.experienceMax
              }
            >
              {generating ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter or generate a detailed job description..."
              value={formData.description}
              onChange={handleChange}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-500">
              You can edit the AI-generated description or write your own
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!formData.title || !formData.description}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={loading || !formData.title || !formData.description}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit("active")}
              disabled={loading || !formData.title || !formData.description}
            >
              Publish Job
            </Button>
          </div>
        </CardContent>
      </Card>

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
            {/* Job Card Preview - Matches public job card design */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {formData.title || "Job Title"}
                    </CardTitle>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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
                            ? `$${parseInt(
                                formData.salaryMin
                              ).toLocaleString()} - $${parseInt(
                                formData.salaryMax
                              ).toLocaleString()}`
                            : formData.salaryMin
                            ? `From $${parseInt(
                                formData.salaryMin
                              ).toLocaleString()}`
                            : `Up to $${parseInt(
                                formData.salaryMax
                              ).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.description ? (
                    <div>
                      <h3 className="font-semibold mb-2">Job Description</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {formData.description.length > 300
                          ? `${formData.description.substring(0, 300)}...`
                          : formData.description}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No description provided
                    </p>
                  )}

                  {formData.skills && (
                    <div>
                      <h3 className="font-semibold mb-2">Required Skills</h3>
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
            <Button
              variant="outline"
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit("draft");
              }}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit("active");
              }}
              disabled={loading}
            >
              Publish Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
