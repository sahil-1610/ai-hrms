"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
  User,
  Briefcase,
  Mail,
  Calendar,
  ExternalLink,
  Trash2,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Notification type icons and colors
const notificationConfig = {
  new_application: {
    icon: User,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
    label: "New Application",
  },
  application_update: {
    icon: Briefcase,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/50",
    label: "Application Update",
  },
  interview_scheduled: {
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
    label: "Interview Scheduled",
  },
  test_completed: {
    icon: Check,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/50",
    label: "Test Completed",
  },
  message: {
    icon: Mail,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    label: "Message",
  },
  default: {
    icon: Bell,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    label: "Notification",
  },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["hr", "admin"].includes(session.user?.role)) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [session, status]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=100");
      const data = await res.json();

      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingRead(true);
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      } else {
        toast.error("Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                      : "All caught up!"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Read"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    All Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("unread")}>
                    Unread Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("read")}>
                    Read Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={markingRead}
                >
                  {markingRead ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredNotifications.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <BellOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {filter === "unread"
                  ? "No unread notifications"
                  : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "Notifications will appear here when there's activity."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const config =
                notificationConfig[notification.type] || notificationConfig.default;
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    relative p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      notification.is_read
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    }
                    hover:shadow-md dark:hover:shadow-gray-900/50
                  `}
                >
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="absolute top-4 right-4">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                  )}

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${config.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`font-medium ${
                              notification.is_read
                                ? "text-gray-900 dark:text-gray-100"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`text-sm mt-0.5 ${
                              notification.is_read
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {notification.message}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {config.label}
                        </Badge>

                        {notification.applications && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {notification.applications.name}
                          </span>
                        )}

                        {notification.jobs && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {notification.jobs.title}
                          </span>
                        )}

                        {notification.link && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View Details
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        )}
      </div>
    </div>
  );
}
