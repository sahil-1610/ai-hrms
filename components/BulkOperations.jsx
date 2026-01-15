"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ChevronDown,
    Users,
    ArrowRight,
    XCircle,
    Mail,
    ClipboardList,
    Mic,
    CheckCircle,
    Loader2,
    X,
} from "lucide-react";

const STAGES = [
    { value: "resume_screening", label: "Resume Screening" },
    { value: "mcq_test", label: "MCQ Test" },
    { value: "async_interview", label: "Async Interview" },
    { value: "live_interview", label: "Live Interview" },
    { value: "offer", label: "Offer" },
];

const STATUSES = [
    { value: "pending", label: "Pending" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "in_progress", label: "In Progress" },
];

export default function BulkOperations({
    selectedIds,
    onClearSelection,
    onActionComplete,
    candidates = [],
}) {
    const [loading, setLoading] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);

    // Reject dialog state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [sendRejectionEmail, setSendRejectionEmail] = useState(true);
    const [rejectionReason, setRejectionReason] = useState("");

    // Email dialog state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");

    const selectedCount = selectedIds.length;

    const executeBulkAction = async (action, data = {}) => {
        setLoading(true);
        setCurrentAction(action);

        try {
            const response = await fetch("/api/applications/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    applicationIds: selectedIds,
                    data,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Action failed");
            }

            // Show success message based on action type
            switch (action) {
                case "update_status":
                    toast.success(`Updated status for ${result.updatedCount} candidates`);
                    break;
                case "advance_stage":
                    toast.success(`Advanced ${result.successCount} candidates`);
                    if (result.errorCount > 0) {
                        toast.error(`${result.errorCount} failed to advance`);
                    }
                    break;
                case "reject":
                    toast.success(`Rejected ${result.rejectedCount} candidates`);
                    break;
                case "send_email":
                    toast.success(`Sent ${result.sentCount} emails`);
                    if (result.errorCount > 0) {
                        toast.error(`${result.errorCount} emails failed`);
                    }
                    break;
                case "send_test_invite":
                    toast.success(`Sent ${result.sentCount} test invitations`);
                    break;
                case "send_interview_invite":
                    toast.success(`Sent ${result.sentCount} interview invitations`);
                    break;
                default:
                    toast.success("Action completed");
            }

            onActionComplete?.();
            onClearSelection?.();
        } catch (error) {
            console.error("Bulk action error:", error);
            toast.error(error.message || "Action failed");
        } finally {
            setLoading(false);
            setCurrentAction(null);
        }
    };

    const handleRejectConfirm = () => {
        executeBulkAction("reject", {
            sendRejectionEmail,
            rejectionReason: rejectionReason.trim() || null,
        });
        setRejectDialogOpen(false);
        setRejectionReason("");
    };

    const handleEmailConfirm = () => {
        if (!emailSubject.trim() || !emailMessage.trim()) {
            toast.error("Subject and message are required");
            return;
        }

        executeBulkAction("send_email", {
            subject: emailSubject.trim(),
            message: emailMessage.trim(),
        });
        setEmailDialogOpen(false);
        setEmailSubject("");
        setEmailMessage("");
    };

    if (selectedCount === 0) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Badge className="bg-blue-500 hover:bg-blue-500">
                    <Users className="h-3 w-3 mr-1" />
                    {selectedCount} selected
                </Badge>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={loading}>
                                {loading && currentAction === "update_status" && (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                )}
                                <CheckCircle className="h-3 w-3 mr-2" />
                                Update Status
                                <ChevronDown className="h-3 w-3 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {STATUSES.map((status) => (
                                <DropdownMenuItem
                                    key={status.value}
                                    onClick={() =>
                                        executeBulkAction("update_status", { status: status.value })
                                    }
                                >
                                    {status.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={loading}>
                                {loading && currentAction === "advance_stage" && (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                )}
                                <ArrowRight className="h-3 w-3 mr-2" />
                                Advance
                                <ChevronDown className="h-3 w-3 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() => executeBulkAction("advance_stage", {})}
                            >
                                Next Stage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {STAGES.map((stage) => (
                                <DropdownMenuItem
                                    key={stage.value}
                                    onClick={() =>
                                        executeBulkAction("advance_stage", { targetStage: stage.value })
                                    }
                                >
                                    To: {stage.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => setRejectDialogOpen(true)}
                    >
                        {loading && currentAction === "reject" && (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        )}
                        <XCircle className="h-3 w-3 mr-2" />
                        Reject
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={loading}>
                                <Mail className="h-3 w-3 mr-2" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
                                <Mail className="h-3 w-3 mr-2" />
                                Custom Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => executeBulkAction("send_test_invite")}
                            >
                                <ClipboardList className="h-3 w-3 mr-2" />
                                MCQ Test Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => executeBulkAction("send_interview_invite")}
                            >
                                <Mic className="h-3 w-3 mr-2" />
                                Interview Invite
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="ml-auto"
                >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                </Button>
            </div>

            {/* Reject Confirmation Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            Reject {selectedCount} Candidates
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            This will reject the selected candidates and optionally send rejection emails.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="send-email"
                                checked={sendRejectionEmail}
                                onCheckedChange={setSendRejectionEmail}
                            />
                            <Label htmlFor="send-email" className="dark:text-gray-200">
                                Send rejection email to candidates
                            </Label>
                        </div>

                        {sendRejectionEmail && (
                            <div className="space-y-2">
                                <Label className="dark:text-gray-200">
                                    Additional Message (optional)
                                </Label>
                                <Textarea
                                    placeholder="We appreciate your interest and encourage you to apply again in the future..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    className="dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRejectConfirm}>
                            Reject {selectedCount} Candidates
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Custom Email Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            Send Email to {selectedCount} Candidates
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Use {"{name}"} and {"{job_title}"} as placeholders in your message.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="dark:text-gray-200">Subject *</Label>
                            <Input
                                placeholder="e.g., Update regarding your application"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="dark:text-gray-200">Message *</Label>
                            <Textarea
                                placeholder={`Dear {name},\n\nWe have an update regarding your application for {job_title}...\n\nBest regards,\nThe Hiring Team`}
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                rows={8}
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEmailConfirm}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send to {selectedCount} Candidates
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
