"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    Send,
    Pin,
    MoreVertical,
    Edit2,
    Trash2,
    User,
    Loader2,
    X,
} from "lucide-react";

export default function CandidateNotes({ applicationId, currentUserId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        if (applicationId) {
            fetchNotes();
        }
    }, [applicationId]);

    const fetchNotes = async () => {
        try {
            const response = await fetch(`/api/notes?applicationId=${applicationId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch notes");
            }

            setNotes(data);
        } catch (error) {
            console.error("Error fetching notes:", error);
            toast.error("Failed to load notes");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newNote.trim()) return;

        setSubmitting(true);
        try {
            const response = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId,
                    content: newNote.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to add note");
            }

            setNotes((prev) => [data, ...prev]);
            setNewNote("");
            toast.success("Note added");
        } catch (error) {
            console.error("Error adding note:", error);
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (noteId) => {
        if (!editContent.trim()) return;

        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update note");
            }

            setNotes((prev) =>
                prev.map((note) => (note.id === noteId ? data : note))
            );
            setEditingId(null);
            setEditContent("");
            toast.success("Note updated");
        } catch (error) {
            console.error("Error updating note:", error);
            toast.error(error.message);
        }
    };

    const handleTogglePin = async (noteId, currentlyPinned) => {
        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: !currentlyPinned }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update note");
            }

            setNotes((prev) => {
                const updated = prev.map((note) =>
                    note.id === noteId ? data : note
                );
                // Sort so pinned notes come first
                return updated.sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                });
            });
            toast.success(currentlyPinned ? "Note unpinned" : "Note pinned");
        } catch (error) {
            console.error("Error toggling pin:", error);
            toast.error(error.message);
        }
    };

    const handleDelete = async (noteId) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete note");
            }

            setNotes((prev) => prev.filter((note) => note.id !== noteId));
            toast.success("Note deleted");
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error(error.message);
        }
    };

    const startEditing = (note) => {
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent("");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Note Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
                <Textarea
                    placeholder="Add a note about this candidate..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={submitting || !newNote.trim()}>
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Add Note
                    </Button>
                </div>
            </form>

            {/* Notes List */}
            {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                    <p className="text-sm">Add the first note about this candidate</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => {
                        const isOwner = currentUserId === note.hr_user_id;
                        const isEditing = editingId === note.id;

                        return (
                            <div
                                key={note.id}
                                className={`p-4 rounded-lg border ${
                                    note.is_pinned
                                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                                        : "bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                            <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium dark:text-gray-200">
                                                {note.hr_users?.name || "Unknown"}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDistanceToNow(new Date(note.created_at), {
                                                    addSuffix: true,
                                                })}
                                                {note.updated_at !== note.created_at && " (edited)"}
                                            </p>
                                        </div>
                                        {note.is_pinned && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs border-yellow-400 text-yellow-600 dark:text-yellow-400"
                                            >
                                                <Pin className="h-2.5 w-2.5 mr-1" />
                                                Pinned
                                            </Badge>
                                        )}
                                    </div>

                                    {isOwner && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => startEditing(note)}>
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleTogglePin(note.id, note.is_pinned)}
                                                >
                                                    <Pin className="mr-2 h-4 w-4" />
                                                    {note.is_pinned ? "Unpin" : "Pin"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(note.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="mt-3 space-y-2">
                                        <Textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={3}
                                            className="dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={cancelEditing}
                                            >
                                                <X className="mr-1 h-3 w-3" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdate(note.id)}
                                                disabled={!editContent.trim()}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {note.content}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
