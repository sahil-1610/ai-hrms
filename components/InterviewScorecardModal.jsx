"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Star } from "lucide-react";

const RATING_LABELS = {
    1: "Poor",
    2: "Below Average",
    3: "Average",
    4: "Good",
    5: "Excellent",
};

const RECOMMENDATIONS = [
    { value: "strong_yes", label: "Strong Yes", color: "text-green-600 dark:text-green-400" },
    { value: "yes", label: "Yes", color: "text-green-500 dark:text-green-400" },
    { value: "neutral", label: "Neutral", color: "text-yellow-600 dark:text-yellow-400" },
    { value: "no", label: "No", color: "text-orange-600 dark:text-orange-400" },
    { value: "strong_no", label: "Strong No", color: "text-red-600 dark:text-red-400" },
];

function RatingSlider({ label, value, onChange }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium dark:text-gray-200">{label}</Label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {value ? `${value}/5 - ${RATING_LABELS[value]}` : "Not rated"}
                </span>
            </div>
            <div className="flex items-center gap-4">
                <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[value || 3]}
                    onValueChange={([val]) => onChange(val)}
                    className="flex-1"
                />
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-4 w-4 cursor-pointer transition-colors ${
                                star <= (value || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                            }`}
                            onClick={() => onChange(star)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function InterviewScorecardModal({
    open,
    onOpenChange,
    interviewId,
    candidateName,
    onSubmit,
    existingScorecard,
}) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        technicalSkills: existingScorecard?.technical_skills || 3,
        communication: existingScorecard?.communication || 3,
        problemSolving: existingScorecard?.problem_solving || 3,
        culturalFit: existingScorecard?.cultural_fit || 3,
        leadership: existingScorecard?.leadership || 3,
        overallRating: existingScorecard?.overall_rating || 3,
        recommendation: existingScorecard?.recommendation || "",
        strengths: existingScorecard?.strengths || "",
        concerns: existingScorecard?.concerns || "",
        notes: existingScorecard?.notes || "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.recommendation) {
            toast.error("Please select a recommendation");
            return;
        }

        setSubmitting(true);
        try {
            const endpoint = existingScorecard
                ? `/api/scorecards/${existingScorecard.id}`
                : "/api/scorecards";
            const method = existingScorecard ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit scorecard");
            }

            toast.success(existingScorecard ? "Scorecard updated" : "Scorecard submitted");
            onSubmit?.(data);
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting scorecard:", error);
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                    <DialogTitle className="dark:text-gray-100">
                        {existingScorecard ? "Edit Scorecard" : "Submit Scorecard"}
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Rate the interview performance for {candidateName || "the candidate"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Skills Ratings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
                            Skills Assessment
                        </h3>
                        <RatingSlider
                            label="Technical Skills"
                            value={formData.technicalSkills}
                            onChange={(val) => updateField("technicalSkills", val)}
                        />
                        <RatingSlider
                            label="Communication"
                            value={formData.communication}
                            onChange={(val) => updateField("communication", val)}
                        />
                        <RatingSlider
                            label="Problem Solving"
                            value={formData.problemSolving}
                            onChange={(val) => updateField("problemSolving", val)}
                        />
                        <RatingSlider
                            label="Cultural Fit"
                            value={formData.culturalFit}
                            onChange={(val) => updateField("culturalFit", val)}
                        />
                        <RatingSlider
                            label="Leadership Potential"
                            value={formData.leadership}
                            onChange={(val) => updateField("leadership", val)}
                        />
                    </div>

                    {/* Overall Rating */}
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Overall Assessment
                        </h3>
                        <RatingSlider
                            label="Overall Rating"
                            value={formData.overallRating}
                            onChange={(val) => updateField("overallRating", val)}
                        />
                        <div className="space-y-2">
                            <Label className="dark:text-gray-200">Recommendation *</Label>
                            <Select
                                value={formData.recommendation}
                                onValueChange={(val) => updateField("recommendation", val)}
                            >
                                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                                    <SelectValue placeholder="Select your recommendation" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RECOMMENDATIONS.map((rec) => (
                                        <SelectItem key={rec.value} value={rec.value}>
                                            <span className={rec.color}>{rec.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Text Feedback */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
                            Detailed Feedback
                        </h3>
                        <div className="space-y-2">
                            <Label className="dark:text-gray-200">Strengths</Label>
                            <Textarea
                                placeholder="What did the candidate do well?"
                                value={formData.strengths}
                                onChange={(e) => updateField("strengths", e.target.value)}
                                rows={3}
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-gray-200">Areas of Concern</Label>
                            <Textarea
                                placeholder="What concerns do you have about this candidate?"
                                value={formData.concerns}
                                onChange={(e) => updateField("concerns", e.target.value)}
                                rows={3}
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-gray-200">Additional Notes</Label>
                            <Textarea
                                placeholder="Any other observations or notes..."
                                value={formData.notes}
                                onChange={(e) => updateField("notes", e.target.value)}
                                rows={3}
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {existingScorecard ? "Update Scorecard" : "Submit Scorecard"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
