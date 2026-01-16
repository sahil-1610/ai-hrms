"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    FileText,
    ClipboardList,
    Mic,
    Calendar,
    User,
    Briefcase,
    Loader2,
} from "lucide-react";

const NOTIFICATION_ICONS = {
    new_application: FileText,
    test_completed: ClipboardList,
    interview_completed: Mic,
    interview_reminder: Calendar,
    candidate_update: User,
    job_update: Briefcase,
};

const NOTIFICATION_COLORS = {
    new_application: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    test_completed: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    interview_completed: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    interview_reminder: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    candidate_update: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    job_update: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [markingRead, setMarkingRead] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch("/api/notifications?limit=20");
            const data = await response.json();

            if (response.ok) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [notificationId] }),
            });

            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingRead(true);
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to mark notifications as read");
        } finally {
            setMarkingRead(false);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    {unreadCount > 0 ? (
                        <BellRing className="h-5 w-5" />
                    ) : (
                        <Bell className="h-5 w-5" />
                    )}
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0 dark:bg-gray-800 dark:border-gray-700"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
                    <h3 className="font-semibold dark:text-gray-100">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={markingRead}
                            className="text-xs h-7"
                        >
                            {markingRead ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <CheckCheck className="h-3 w-3 mr-1" />
                            )}
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-80">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 opacity-50" />
                            </div>
                            <p className="text-sm font-medium mb-1">No notifications yet</p>
                            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                                You'll see notifications here when candidates apply, complete tests, or finish interviews.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-gray-700">
                            {notifications.map((notification) => {
                                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                                const colorClass =
                                    NOTIFICATION_COLORS[notification.type] ||
                                    NOTIFICATION_COLORS.job_update;
                                const isUnread = !notification.is_read;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                                            isUnread
                                                ? "bg-blue-50/50 dark:bg-blue-900/20"
                                                : "opacity-75"
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {notification.link ? (
                                            <Link href={notification.link} className="block">
                                                <NotificationContent
                                                    notification={notification}
                                                    Icon={Icon}
                                                    colorClass={colorClass}
                                                    isUnread={isUnread}
                                                />
                                            </Link>
                                        ) : (
                                            <NotificationContent
                                                notification={notification}
                                                Icon={Icon}
                                                colorClass={colorClass}
                                                isUnread={isUnread}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-2 border-t dark:border-gray-700">
                        <Link href="/admin/notifications">
                            <Button variant="ghost" className="w-full text-sm">
                                View all notifications
                            </Button>
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function NotificationContent({ notification, Icon, colorClass, isUnread }) {
    return (
        <div className="flex gap-3">
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
            >
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm truncate dark:text-gray-100 ${
                        isUnread ? "font-semibold" : "font-normal text-gray-600 dark:text-gray-400"
                    }`}>
                        {notification.title}
                    </p>
                    {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                </div>
                <p className={`text-xs line-clamp-2 ${
                    isUnread
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-500 dark:text-gray-500"
                }`}>
                    {notification.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                    })}
                </p>
            </div>
        </div>
    );
}
