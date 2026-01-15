"use client";

import { useState, useEffect, use } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  MapPin,
  Briefcase,
  DollarSign,
  Loader2,
  Trash2,
  Settings2,
  Users,
} from "lucide-react";
import PipelineConfig from "@/components/PipelineConfig";

export default function EditJobPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    experienceMin: "",
    experienceMax: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    description: "",
    status: "active",
    numberOfPositions: "1",
  });

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job");
      }

      let salaryMin = "";
      let salaryMax = "";
      if (data.salary_range) {
        const salaryMatch = data.salary_range.match(/\$?([\d,]+)/g);
        if (salaryMatch) {
          salaryMin = salaryMatch[0]?.replace(/[$,]/g, "") || "";
          if (salaryMatch[1]) {
            salaryMax = salaryMatch[1]?.replace(/[$,]/g, "") || "";
          }
        }
      }

      setFormData({
        title: data.title || "",
        location: data.location || "",
        experienceMin: data.experience_min?.toString() || "",
        experienceMax: data.experience_max?.toString() || "",
        salaryMin,
        salaryMax,
        skills: data.skills?.join(", ") || "",
        description: data.description || data.jd_text || "",
        status: data.status || "active",
        numberOfPositions: data.number_of_positions?.toString() || "1",
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
      router.push("/admin/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
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
        toast.error(errorMessage);
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

  const handleSubmit = async () => {
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

    setSaving(true);
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
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
          status: formData.status,
          numberOfPositions: parseInt(formData.numberOfPositions) || 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update job");
      }

      toast.success("Job updated successfully!");
      router.push("/admin/jobs");
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete job");
      }

      toast.success("Job deleted successfully!");
      router.push("/admin/jobs");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Edit Job Posting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update the job details and save changes
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete Job
        </Button>
      </div>

      {/* Form */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Job Details</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Update the information about the position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="dark:text-gray-200">Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48 dark:bg-gray-700 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="dark:text-gray-200">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Senior Full Stack Developer"
              value={formData.title}
              onChange={handleChange}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="dark:text-gray-200">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., San Francisco, CA (Remote)"
              value={formData.location}
              onChange={handleChange}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Experience Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceMin" className="dark:text-gray-200">
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
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceMax" className="dark:text-gray-200">
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
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin" className="dark:text-gray-200">Min Salary ($)</Label>
              <Input
                id="salaryMin"
                name="salaryMin"
                type="number"
                min="0"
                placeholder="80000"
                value={formData.salaryMin}
                onChange={handleChange}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax" className="dark:text-gray-200">Max Salary ($)</Label>
              <Input
                id="salaryMax"
                name="salaryMax"
                type="number"
                min="0"
                placeholder="120000"
                value={formData.salaryMax}
                onChange={handleChange}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Number of Positions */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPositions" className="dark:text-gray-200">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Positions
              </span>
            </Label>
            <Input
              id="numberOfPositions"
              name="numberOfPositions"
              type="number"
              min="1"
              placeholder="1"
              value={formData.numberOfPositions}
              onChange={handleChange}
              className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              How many openings are available for this role?
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills" className="dark:text-gray-200">Required Skills</Label>
            <Input
              id="skills"
              name="skills"
              placeholder="e.g., React, Node.js, PostgreSQL (comma-separated)"
              value={formData.skills}
              onChange={handleChange}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter skills separated by commas
            </p>
          </div>

          {/* AI Generate Button */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                AI-Powered Job Description
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Regenerate a professional job description based on your inputs
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="dark:text-gray-200">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter or generate a detailed job description..."
              value={formData.description}
              onChange={handleChange}
              rows={12}
              className="font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can edit the AI-generated description or write your own
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
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
              onClick={handleSubmit}
              disabled={saving || !formData.title || !formData.description}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Configuration */}
      <PipelineConfig jobId={id} />

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Job Preview</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              This is how candidates will see this job posting
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2 dark:text-gray-100">
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
                  <Badge
                    variant={formData.status === "active" ? "default" : "secondary"}
                  >
                    {formData.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.description ? (
                    <div>
                      <h3 className="font-semibold mb-2 dark:text-gray-100">Job Description</h3>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {formData.description.length > 300
                          ? `${formData.description.substring(0, 300)}...`
                          : formData.description}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No description provided
                    </p>
                  )}

                  {formData.skills && (
                    <div>
                      <h3 className="font-semibold mb-2 dark:text-gray-100">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="dark:bg-gray-600 dark:text-gray-200">
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
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit();
              }}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
