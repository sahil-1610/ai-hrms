"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileQuestion,
  Loader2,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function TestManagement({ jobId }) {
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/generate?jobId=${jobId}`);

      if (response.ok) {
        const data = await response.json();
        setTest(data);
      } else if (response.status === 404) {
        // No test generated yet
        setTest(null);
      } else {
        throw new Error("Failed to fetch test");
      }
    } catch (error) {
      console.error("Error fetching test:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTest = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate test");
      }

      setTest(data);
      toast.success("Test generated successfully!");
    } catch (error) {
      console.error("Error generating test:", error);
      toast.error(error.message || "Failed to generate test");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteTest = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this test? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/tests/generate?jobId=${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete test");
      }

      setTest(null);
      toast.success("Test deleted successfully");
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error(error.message || "Failed to delete test");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <FileQuestion className="h-5 w-5" />
                Technical Assessment
              </CardTitle>
              <CardDescription className="mt-1 dark:text-gray-400">
                {test
                  ? "AI-generated MCQ test for candidate evaluation"
                  : "Generate an automated test for this position"}
              </CardDescription>
            </div>
            {test && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Test Ready
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!test ? (
            <Button
              onClick={handleGenerateTest}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Test...
                </>
              ) : (
                <>
                  <FileQuestion className="h-4 w-4" />
                  Generate Test with AI
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Questions</p>
                  <p className="font-semibold text-lg dark:text-gray-100">
                    {test.questions?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-semibold text-lg flex items-center gap-1 dark:text-gray-100">
                    <Clock className="h-4 w-4" />
                    {test.duration_minutes || 0} min
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Passing Score
                  </p>
                  <p className="font-semibold text-lg dark:text-gray-100">
                    {test.passing_score || 0}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Questions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTest}
                  disabled={generating}
                  className="gap-2"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteTest}
                  disabled={deleting}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Test Preview
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {test?.questions?.length || 0} questions •{" "}
              {test?.duration_minutes || 0} minutes • Passing score:{" "}
              {test?.passing_score || 0}%
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {test?.questions?.map((question, index) => (
              <div
                key={index}
                className="border dark:border-gray-700 rounded-lg p-4 dark:bg-gray-800"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {index + 1}. {question.q}
                </p>
                <div className="space-y-2 ml-4">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded ${
                        optionIndex === question.correctIndex
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100"
                          : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      {option}
                      {optionIndex === question.correctIndex && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                        >
                          Correct
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
