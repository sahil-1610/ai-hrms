"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  ListChecks,
  Mic,
  Video,
  Gift,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Save,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PIPELINE_CONFIG = {
  stages: {
    resume_screening: { enabled: true, auto_advance_threshold: 60 },
    mcq_test: { enabled: true, auto_advance_threshold: 60 },
    async_interview: { enabled: true, auto_advance_threshold: 50 },
    live_interview: { enabled: true },
    offer: { enabled: true },
  },
  scoring_weights: {
    resume: 0.4,
    mcq: 0.3,
    async_interview: 0.2,
    live_interview: 0.1,
  },
};

const DEFAULT_MCQ_CONFIG = {
  enabled: true,
  question_count: 10,
  duration_minutes: 30,
  passing_score: 60,
  difficulty: "mixed",
  difficulty_distribution: { easy: 30, medium: 50, hard: 20 },
};

const STAGE_INFO = {
  resume_screening: {
    icon: FileText,
    label: "Resume Screening",
    description: "AI evaluates candidate resume against job requirements",
  },
  mcq_test: {
    icon: ListChecks,
    label: "MCQ Test",
    description: "Technical assessment with multiple choice questions",
  },
  async_interview: {
    icon: Mic,
    label: "Async Interview",
    description: "Candidates record video/audio answers to questions",
  },
  live_interview: {
    icon: Video,
    label: "Live Interview",
    description: "Scheduled video/phone interview with HR or hiring manager",
  },
  offer: {
    icon: Gift,
    label: "Offer",
    description: "Final stage for making job offers to selected candidates",
  },
};

export default function PipelineConfig({ jobId, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pipelineConfig, setPipelineConfig] = useState(DEFAULT_PIPELINE_CONFIG);
  const [mcqConfig, setMcqConfig] = useState(DEFAULT_MCQ_CONFIG);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [openSections, setOpenSections] = useState({
    stages: true,
    mcq: false,
    interview: false,
    scoring: false,
  });

  useEffect(() => {
    if (jobId) {
      fetchPipelineConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchPipelineConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/pipeline`);
      if (response.ok) {
        const data = await response.json();
        if (data.pipelineConfig) {
          setPipelineConfig(data.pipelineConfig);
        }
        if (data.mcqConfig) {
          setMcqConfig(data.mcqConfig);
        }
        if (data.interviewQuestions) {
          setInterviewQuestions(data.interviewQuestions);
        }
      }
    } catch (error) {
      console.error("Error fetching pipeline config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate scoring weights sum to 1
      const totalWeight = Object.values(pipelineConfig.scoring_weights).reduce(
        (sum, w) => sum + w,
        0
      );
      if (Math.abs(totalWeight - 1) > 0.01) {
        toast.error("Scoring weights must sum to 100%");
        return;
      }

      const response = await fetch(`/api/jobs/${jobId}/pipeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineConfig,
          mcqConfig,
          interviewQuestions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save pipeline configuration");
      }

      toast.success("Pipeline configuration saved!");
      onSave?.();
    } catch (error) {
      console.error("Error saving pipeline config:", error);
      toast.error(error.message || "Failed to save pipeline configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateStage = (stage, field, value) => {
    setPipelineConfig((prev) => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stage]: {
          ...prev.stages[stage],
          [field]: value,
        },
      },
    }));
  };

  const updateScoringWeight = (key, value) => {
    setPipelineConfig((prev) => ({
      ...prev,
      scoring_weights: {
        ...prev.scoring_weights,
        [key]: value,
      },
    }));
  };

  const addInterviewQuestion = () => {
    setInterviewQuestions((prev) => [
      ...prev,
      {
        question: "",
        max_duration_seconds: 120,
        category: "general",
        is_required: true,
      },
    ]);
  };

  const updateInterviewQuestion = (index, field, value) => {
    setInterviewQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const removeInterviewQuestion = (index) => {
    setInterviewQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-100">
          <Settings2 className="h-5 w-5" />
          Hiring Pipeline Configuration
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Configure the hiring stages, MCQ settings, and interview questions for
          this job
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline Stages */}
        <Collapsible
          open={openSections.stages}
          onOpenChange={() => toggleSection("stages")}
        >
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="font-medium dark:text-gray-100">
                Pipeline Stages
              </span>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  openSections.stages ? "rotate-180" : ""
                }`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {Object.entries(STAGE_INFO).map(([stageKey, info]) => {
              const Icon = info.icon;
              const stage = pipelineConfig.stages[stageKey] || { enabled: true };
              return (
                <div
                  key={stageKey}
                  className={`p-4 rounded-lg border transition-colors ${
                    stage.enabled
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          stage.enabled
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-gray-100">
                          {info.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {info.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={stage.enabled}
                      onCheckedChange={(checked) =>
                        updateStage(stageKey, "enabled", checked)
                      }
                    />
                  </div>

                  {stage.enabled && stage.auto_advance_threshold !== undefined && (
                    <div className="mt-4 pl-12">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm dark:text-gray-300">
                          Auto-advance threshold
                        </Label>
                        <span className="text-sm font-medium dark:text-gray-200">
                          {stage.auto_advance_threshold}%
                        </span>
                      </div>
                      <Slider
                        value={[stage.auto_advance_threshold]}
                        onValueChange={([value]) =>
                          updateStage(stageKey, "auto_advance_threshold", value)
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Candidates scoring above this will automatically advance
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* MCQ Configuration */}
        <Collapsible
          open={openSections.mcq}
          onOpenChange={() => toggleSection("mcq")}
        >
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="font-medium dark:text-gray-100">
                MCQ Test Settings
              </span>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  openSections.mcq ? "rotate-180" : ""
                }`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Number of Questions</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={mcqConfig.question_count}
                  onChange={(e) =>
                    setMcqConfig({
                      ...mcqConfig,
                      question_count: parseInt(e.target.value) || 10,
                    })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Duration (minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={mcqConfig.duration_minutes}
                  onChange={(e) =>
                    setMcqConfig({
                      ...mcqConfig,
                      duration_minutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Passing Score (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={mcqConfig.passing_score}
                  onChange={(e) =>
                    setMcqConfig({
                      ...mcqConfig,
                      passing_score: parseInt(e.target.value) || 60,
                    })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Difficulty Level</Label>
                <Select
                  value={mcqConfig.difficulty}
                  onValueChange={(value) =>
                    setMcqConfig({ ...mcqConfig, difficulty: value })
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mcqConfig.difficulty === "mixed" && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Label className="dark:text-gray-200">
                  Difficulty Distribution
                </Label>
                <div className="space-y-2">
                  {["easy", "medium", "hard"].map((level) => (
                    <div
                      key={level}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize dark:text-gray-300">
                        {level}
                      </span>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[mcqConfig.difficulty_distribution?.[level] || 0]}
                          onValueChange={([value]) =>
                            setMcqConfig({
                              ...mcqConfig,
                              difficulty_distribution: {
                                ...mcqConfig.difficulty_distribution,
                                [level]: value,
                              },
                            })
                          }
                          min={0}
                          max={100}
                          step={5}
                          className="w-32"
                        />
                        <span className="text-sm font-medium w-12 text-right dark:text-gray-200">
                          {mcqConfig.difficulty_distribution?.[level] || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Interview Questions */}
        <Collapsible
          open={openSections.interview}
          onOpenChange={() => toggleSection("interview")}
        >
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="font-medium dark:text-gray-100">
                Custom Interview Questions ({interviewQuestions.length})
              </span>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  openSections.interview ? "rotate-180" : ""
                }`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {interviewQuestions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No custom questions. Default interview questions will be used.
              </p>
            )}

            {interviewQuestions.map((question, index) => (
              <div
                key={index}
                className="p-4 border dark:border-gray-700 rounded-lg space-y-3"
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-grab" />
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Enter your interview question..."
                      value={question.question}
                      onChange={(e) =>
                        updateInterviewQuestion(index, "question", e.target.value)
                      }
                      rows={2}
                      className="dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm dark:text-gray-300">
                          Max Duration (sec)
                        </Label>
                        <Input
                          type="number"
                          min={30}
                          max={600}
                          value={question.max_duration_seconds}
                          onChange={(e) =>
                            updateInterviewQuestion(
                              index,
                              "max_duration_seconds",
                              parseInt(e.target.value) || 120
                            )
                          }
                          className="w-24 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <Select
                        value={question.category}
                        onValueChange={(value) =>
                          updateInterviewQuestion(index, "category", value)
                        }
                      >
                        <SelectTrigger className="w-32 dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                          <SelectItem value="motivation">Motivation</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.is_required}
                          onCheckedChange={(checked) =>
                            updateInterviewQuestion(index, "is_required", checked)
                          }
                        />
                        <Label className="text-sm dark:text-gray-300">
                          Required
                        </Label>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInterviewQuestion(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addInterviewQuestion}
              className="w-full dark:border-gray-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Scoring Weights */}
        <Collapsible
          open={openSections.scoring}
          onOpenChange={() => toggleSection("scoring")}
        >
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="font-medium dark:text-gray-100">
                Scoring Weights
              </span>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  openSections.scoring ? "rotate-180" : ""
                }`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Define how much each stage contributes to the overall candidate
              score. Weights must sum to 100%.
            </p>

            {Object.entries(pipelineConfig.scoring_weights).map(
              ([key, weight]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-sm font-medium capitalize dark:text-gray-200">
                    {key.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[weight * 100]}
                      onValueChange={([value]) =>
                        updateScoringWeight(key, value / 100)
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-32"
                    />
                    <span className="text-sm font-medium w-12 text-right dark:text-gray-200">
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                </div>
              )
            )}

            {(() => {
              const total = Object.values(pipelineConfig.scoring_weights).reduce(
                (sum, w) => sum + w,
                0
              );
              const isValid = Math.abs(total - 1) <= 0.01;
              return (
                <div
                  className={`p-3 rounded-lg ${
                    isValid
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  <span className="text-sm font-medium">
                    Total: {Math.round(total * 100)}%{" "}
                    {isValid ? "(Valid)" : "(Must equal 100%)"}
                  </span>
                </div>
              );
            })()}
          </CollapsibleContent>
        </Collapsible>

        {/* Save Button */}
        <div className="pt-4 border-t dark:border-gray-700">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Pipeline Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
