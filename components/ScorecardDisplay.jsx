"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, User, Edit2, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";

const RECOMMENDATION_COLORS = {
    strong_yes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    yes: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    neutral: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    no: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    strong_no: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const RECOMMENDATION_LABELS = {
    strong_yes: "Strong Yes",
    yes: "Yes",
    neutral: "Neutral",
    no: "No",
    strong_no: "Strong No",
};

function StarRating({ value, size = "sm" }) {
    const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${starSize} ${
                        star <= value
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                    }`}
                />
            ))}
        </div>
    );
}

function ScoreRow({ label, value }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            <StarRating value={value} />
        </div>
    );
}

export default function ScorecardDisplay({ scorecards, onEdit, currentUserId }) {
    const [expandedId, setExpandedId] = useState(null);

    if (!scorecards || scorecards.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No scorecards submitted yet</p>
            </div>
        );
    }

    // Calculate average scores
    const avgScores = {
        technical: 0,
        communication: 0,
        problemSolving: 0,
        culturalFit: 0,
        leadership: 0,
        overall: 0,
    };

    scorecards.forEach((sc) => {
        avgScores.technical += sc.technical_skills || 0;
        avgScores.communication += sc.communication || 0;
        avgScores.problemSolving += sc.problem_solving || 0;
        avgScores.culturalFit += sc.cultural_fit || 0;
        avgScores.leadership += sc.leadership || 0;
        avgScores.overall += sc.overall_rating || 0;
    });

    const count = scorecards.length;
    Object.keys(avgScores).forEach((key) => {
        avgScores[key] = Math.round((avgScores[key] / count) * 10) / 10;
    });

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 dark:text-gray-100">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Average Scores ({count} {count === 1 ? "scorecard" : "scorecards"})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <ScoreRow label="Technical" value={Math.round(avgScores.technical)} />
                        <ScoreRow label="Communication" value={Math.round(avgScores.communication)} />
                        <ScoreRow label="Problem Solving" value={Math.round(avgScores.problemSolving)} />
                        <ScoreRow label="Cultural Fit" value={Math.round(avgScores.culturalFit)} />
                        <ScoreRow label="Leadership" value={Math.round(avgScores.leadership)} />
                        <ScoreRow label="Overall" value={Math.round(avgScores.overall)} />
                    </div>
                </CardContent>
            </Card>

            {/* Individual Scorecards */}
            {scorecards.map((scorecard) => {
                const isExpanded = expandedId === scorecard.id;
                const isOwner = currentUserId === scorecard.interviewer_id;

                return (
                    <Card
                        key={scorecard.id}
                        className="dark:bg-gray-800 dark:border-gray-700"
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm dark:text-gray-100">
                                            {scorecard.hr_users?.name || "Unknown Interviewer"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDistanceToNow(new Date(scorecard.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={RECOMMENDATION_COLORS[scorecard.recommendation]}>
                                        {RECOMMENDATION_LABELS[scorecard.recommendation]}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        <StarRating value={scorecard.overall_rating} />
                                    </div>
                                    {isOwner && onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onEdit(scorecard)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setExpandedId(isExpanded ? null : scorecard.id)}
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        {isExpanded && (
                            <CardContent className="pt-0 border-t dark:border-gray-700 mt-2">
                                <div className="space-y-4 pt-4">
                                    {/* Detailed Scores */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <ScoreRow label="Technical" value={scorecard.technical_skills} />
                                        <ScoreRow label="Communication" value={scorecard.communication} />
                                        <ScoreRow label="Problem Solving" value={scorecard.problem_solving} />
                                        <ScoreRow label="Cultural Fit" value={scorecard.cultural_fit} />
                                        <ScoreRow label="Leadership" value={scorecard.leadership} />
                                        <ScoreRow label="Overall" value={scorecard.overall_rating} />
                                    </div>

                                    {/* Strengths */}
                                    {scorecard.strengths && (
                                        <div>
                                            <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" /> Strengths
                                            </h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {scorecard.strengths}
                                            </p>
                                        </div>
                                    )}

                                    {/* Concerns */}
                                    {scorecard.concerns && (
                                        <div>
                                            <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                                                <ThumbsDown className="h-3 w-3" /> Concerns
                                            </h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {scorecard.concerns}
                                            </p>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {scorecard.notes && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Additional Notes
                                            </h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {scorecard.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
