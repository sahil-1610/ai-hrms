"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, Video, Phone, MapPin, Loader2, Users } from "lucide-react";

export default function ScheduleInterviewModal({
  open,
  onOpenChange,
  applicationId,
  candidateName,
  jobTitle,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduledAt: "",
    durationMinutes: 30, // Default 30 minutes
    timezone: "Asia/Kolkata", // India IST
    interviewType: "video",
    interviewerEmails: "",
    notes: "",
  });

  const timezones = [
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Phoenix", label: "Arizona (AZ)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
  ];

  const durations = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  const interviewTypes = [
    { value: "video", label: "Video Call (Google Meet)", icon: Video },
    { value: "phone", label: "Phone Call", icon: Phone },
    { value: "in_person", label: "In-Person", icon: MapPin },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse interviewer emails
      const interviewerEmails = formData.interviewerEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      const response = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          durationMinutes: formData.durationMinutes,
          timezone: formData.timezone,
          interviewType: formData.interviewType,
          interviewerEmails,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule interview");
      }

      toast.success("Interview scheduled successfully!");

      if (data.interview?.meetLink) {
        toast.success("Google Meet link created and sent to candidate");
      }

      onSuccess?.(data.interview);
      onOpenChange(false);

      // Reset form
      setFormData({
        scheduledAt: "",
        durationMinutes: 30,
        timezone: "Asia/Kolkata", // India IST
        interviewType: "video",
        interviewerEmails: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast.error(error.message || "Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Schedule a {formData.interviewType === "video" ? "video" : formData.interviewType === "phone" ? "phone" : "in-person"} interview with {candidateName} for {jobTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt" className="dark:text-gray-200">
              Date & Time *
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              min={getMinDateTime()}
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Duration & Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="dark:text-gray-200">
                Duration
              </Label>
              <Select
                value={formData.durationMinutes.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, durationMinutes: parseInt(value) })
                }
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="dark:text-gray-200">
                Timezone
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label className="dark:text-gray-200">Interview Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {interviewTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, interviewType: type.value })
                    }
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                      formData.interviewType === type.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{type.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
            {formData.interviewType === "video" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A Google Meet link will be automatically created and sent to the candidate
              </p>
            )}
          </div>

          {/* Interviewer Emails */}
          <div className="space-y-2">
            <Label htmlFor="interviewerEmails" className="flex items-center gap-2 dark:text-gray-200">
              <Users className="h-4 w-4" />
              Additional Interviewers
            </Label>
            <Input
              id="interviewerEmails"
              placeholder="email1@company.com, email2@company.com"
              value={formData.interviewerEmails}
              onChange={(e) =>
                setFormData({ ...formData, interviewerEmails: e.target.value })
              }
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Comma-separated emails of other interviewers to invite
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="dark:text-gray-200">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for this interview..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.scheduledAt}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
