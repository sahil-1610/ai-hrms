"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function ScheduledInterviewDetails({ interviewId }) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      const response = await fetch(
        `/api/interviews/schedule?applicationId=${interviewId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Get the most recent interview for this application
        if (Array.isArray(data) && data.length > 0) {
          setInterview(data[0]);
        } else if (data && !Array.isArray(data)) {
          setInterview(data);
        }
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Separator className="dark:bg-gray-700" />
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  if (!interview) {
    return null;
  }

  const getStatusBadge = (status) => {
    const variants = {
      scheduled: { variant: "secondary", label: "Scheduled" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      no_show: { variant: "destructive", label: "No Show" },
      rescheduled: { variant: "outline", label: "Rescheduled" },
    };
    return variants[status] || { variant: "secondary", label: status };
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "in_person":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const statusInfo = getStatusBadge(interview.status);

  return (
    <>
      <Separator className="dark:bg-gray-700" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Interview
          </h4>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        <div className="space-y-4">
          {/* Interview Details */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                {new Date(interview.scheduled_at).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                {getInterviewTypeIcon(interview.interview_type)}
                {interview.interview_type === "video"
                  ? "Video"
                  : interview.interview_type === "phone"
                  ? "Phone"
                  : "In-Person"}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {interview.duration_minutes} min
              </div>
            </div>

            {interview.google_meet_link && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={interview.google_meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Join Google Meet
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}

            {interview.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {interview.notes}
              </p>
            )}
          </div>

          {/* Fathom AI Data */}
          {interview.fathom_recording_id && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
                Fathom AI Recording Available
              </div>

              {/* Summary */}
              {interview.fathom_summary && (
                <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-3 text-left bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <span className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                        <MessageSquare className="h-4 w-4" />
                        AI Summary
                      </span>
                      {summaryOpen ? (
                        <ChevronUp className="h-4 w-4 text-purple-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-purple-600" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {typeof interview.fathom_summary === "string"
                          ? interview.fathom_summary
                          : JSON.stringify(interview.fathom_summary, null, 2)}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Transcript */}
              {interview.fathom_transcript && (
                <Collapsible
                  open={transcriptOpen}
                  onOpenChange={setTranscriptOpen}
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-3 text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <span className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                        <FileText className="h-4 w-4" />
                        Full Transcript
                      </span>
                      {transcriptOpen ? (
                        <ChevronUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                        {interview.fathom_transcript}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
