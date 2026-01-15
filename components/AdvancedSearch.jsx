"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Search,
    SlidersHorizontal,
    X,
    Calendar as CalendarIcon,
    Star,
    Briefcase,
    MapPin,
    Check,
} from "lucide-react";
import { format } from "date-fns";

const STAGES = [
    { value: "resume_screening", label: "Resume Screening" },
    { value: "mcq_test", label: "MCQ Test" },
    { value: "async_interview", label: "Async Interview" },
    { value: "live_interview", label: "Live Interview" },
    { value: "offer", label: "Offer" },
    { value: "hired", label: "Hired" },
    { value: "rejected", label: "Rejected" },
];

const STATUSES = [
    { value: "pending", label: "Pending" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "in_progress", label: "In Progress" },
    { value: "rejected", label: "Rejected" },
    { value: "hired", label: "Hired" },
];

export default function AdvancedSearch({
    onSearch,
    jobs = [],
    initialFilters = {},
}) {
    const [searchQuery, setSearchQuery] = useState(initialFilters.search || "");
    const [filters, setFilters] = useState({
        jobId: initialFilters.jobId || "",
        stage: initialFilters.stage || "",
        status: initialFilters.status || "",
        minScore: initialFilters.minScore || 0,
        maxScore: initialFilters.maxScore || 100,
        minExperience: initialFilters.minExperience || 0,
        maxExperience: initialFilters.maxExperience || 20,
        skills: initialFilters.skills || [],
        dateFrom: initialFilters.dateFrom || null,
        dateTo: initialFilters.dateTo || null,
    });
    const [skillInput, setSkillInput] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch?.({
                search: searchQuery,
                ...filters,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, filters, onSearch]);

    const updateFilter = (key, value) => {
        // Convert "all" to empty string for actual filtering
        const actualValue = value === "all" ? "" : value;
        setFilters((prev) => ({ ...prev, [key]: actualValue }));
    };

    const addSkill = () => {
        if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
            updateFilter("skills", [...filters.skills, skillInput.trim()]);
            setSkillInput("");
        }
    };

    const removeSkill = (skill) => {
        updateFilter(
            "skills",
            filters.skills.filter((s) => s !== skill)
        );
    };

    const clearAllFilters = () => {
        setSearchQuery("");
        setFilters({
            jobId: "",
            stage: "",
            status: "",
            minScore: 0,
            maxScore: 100,
            minExperience: 0,
            maxExperience: 20,
            skills: [],
            dateFrom: null,
            dateTo: null,
        });
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.jobId) count++;
        if (filters.stage) count++;
        if (filters.status) count++;
        if (filters.minScore > 0 || filters.maxScore < 100) count++;
        if (filters.minExperience > 0 || filters.maxExperience < 20) count++;
        if (filters.skills.length > 0) count++;
        if (filters.dateFrom || filters.dateTo) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <div className="space-y-3">
            {/* Main Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, email, skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 dark:bg-gray-800 dark:border-gray-700"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Quick Filters */}
                <Select
                    value={filters.jobId || "all"}
                    onValueChange={(val) => updateFilter("jobId", val)}
                >
                    <SelectTrigger className="w-48 dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="All Jobs" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                                {job.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status || "all"}
                    onValueChange={(val) => updateFilter("status", val)}
                >
                    <SelectTrigger className="w-36 dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Advanced Filters Sheet */}
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="relative dark:bg-gray-800 dark:border-gray-700">
                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-500">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="dark:bg-gray-800 dark:border-gray-700 w-80">
                        <SheetHeader>
                            <SheetTitle className="dark:text-gray-100">
                                Advanced Filters
                            </SheetTitle>
                            <SheetDescription className="dark:text-gray-400">
                                Refine your candidate search
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6 mt-6">
                            {/* Stage Filter */}
                            <div className="space-y-2">
                                <Label className="dark:text-gray-200">Pipeline Stage</Label>
                                <Select
                                    value={filters.stage || "all"}
                                    onValueChange={(val) => updateFilter("stage", val)}
                                >
                                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                        <SelectValue placeholder="All Stages" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stages</SelectItem>
                                        {STAGES.map((stage) => (
                                            <SelectItem key={stage.value} value={stage.value}>
                                                {stage.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="dark:bg-gray-700" />

                            {/* Score Range */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="dark:text-gray-200 flex items-center gap-2">
                                        <Star className="h-4 w-4" />
                                        Match Score
                                    </Label>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {filters.minScore}% - {filters.maxScore}%
                                    </span>
                                </div>
                                <Slider
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={[filters.minScore, filters.maxScore]}
                                    onValueChange={([min, max]) => {
                                        updateFilter("minScore", min);
                                        updateFilter("maxScore", max);
                                    }}
                                />
                            </div>

                            <Separator className="dark:bg-gray-700" />

                            {/* Experience Range */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="dark:text-gray-200 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Experience
                                    </Label>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {filters.minExperience} - {filters.maxExperience} years
                                    </span>
                                </div>
                                <Slider
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={[filters.minExperience, filters.maxExperience]}
                                    onValueChange={([min, max]) => {
                                        updateFilter("minExperience", min);
                                        updateFilter("maxExperience", max);
                                    }}
                                />
                            </div>

                            <Separator className="dark:bg-gray-700" />

                            {/* Skills Filter */}
                            <div className="space-y-2">
                                <Label className="dark:text-gray-200">Skills</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add skill..."
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addSkill();
                                            }
                                        }}
                                        className="dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        onClick={addSkill}
                                        disabled={!skillInput.trim()}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                                {filters.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {filters.skills.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant="secondary"
                                                className="cursor-pointer dark:bg-gray-700"
                                                onClick={() => removeSkill(skill)}
                                            >
                                                {skill}
                                                <X className="h-3 w-3 ml-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator className="dark:bg-gray-700" />

                            {/* Date Range */}
                            <div className="space-y-2">
                                <Label className="dark:text-gray-200 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Application Date
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                {filters.dateFrom
                                                    ? format(filters.dateFrom, "MMM d")
                                                    : "From"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={filters.dateFrom}
                                                onSelect={(date) => updateFilter("dateFrom", date)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                {filters.dateTo
                                                    ? format(filters.dateTo, "MMM d")
                                                    : "To"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={filters.dateTo}
                                                onSelect={(date) => updateFilter("dateTo", date)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <Separator className="dark:bg-gray-700" />

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={clearAllFilters}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => setIsFiltersOpen(false)}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Active Filters Display */}
            {(activeFilterCount > 0 || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active:</span>
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1 dark:bg-gray-700">
                            Search: "{searchQuery}"
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setSearchQuery("")}
                            />
                        </Badge>
                    )}
                    {filters.jobId && (
                        <Badge variant="secondary" className="gap-1 dark:bg-gray-700">
                            Job: {jobs.find((j) => j.id === filters.jobId)?.title || filters.jobId}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter("jobId", "")}
                            />
                        </Badge>
                    )}
                    {filters.status && (
                        <Badge variant="secondary" className="gap-1 dark:bg-gray-700">
                            Status: {STATUSES.find((s) => s.value === filters.status)?.label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter("status", "")}
                            />
                        </Badge>
                    )}
                    {filters.stage && (
                        <Badge variant="secondary" className="gap-1 dark:bg-gray-700">
                            Stage: {STAGES.find((s) => s.value === filters.stage)?.label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter("stage", "")}
                            />
                        </Badge>
                    )}
                    {(filters.minScore > 0 || filters.maxScore < 100) && (
                        <Badge variant="secondary" className="gap-1 dark:bg-gray-700">
                            Score: {filters.minScore}%-{filters.maxScore}%
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    updateFilter("minScore", 0);
                                    updateFilter("maxScore", 100);
                                }}
                            />
                        </Badge>
                    )}
                    {filters.skills.map((skill) => (
                        <Badge
                            key={skill}
                            variant="secondary"
                            className="gap-1 dark:bg-gray-700"
                        >
                            Skill: {skill}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeSkill(skill)}
                            />
                        </Badge>
                    ))}
                    {(filters.dateFrom || filters.dateTo) && (
                        <Badge variant="secondary" className="gap-1 dark:bg-gray-700">
                            Date: {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "Start"} -{" "}
                            {filters.dateTo ? format(filters.dateTo, "MMM d") : "End"}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    updateFilter("dateFrom", null);
                                    updateFilter("dateTo", null);
                                }}
                            />
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={clearAllFilters}
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}
