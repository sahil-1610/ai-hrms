"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/jobs?status=active"),
        fetch("/api/applications"),
      ]);

      const jobs = await jobsRes.json();
      const apps = await appsRes.json();

      if (jobsRes.ok && appsRes.ok) {
        // Calculate stats
        const shortlistedCount = apps.filter(
          (app) => app.status === "shortlisted"
        ).length;

        const now = new Date();
        const thisMonthCount = apps.filter((app) => {
          const appDate = new Date(app.created_at);
          return (
            appDate.getMonth() === now.getMonth() &&
            appDate.getFullYear() === now.getFullYear()
          );
        }).length;

        setStats({
          activeJobs: jobs.length || 0,
          totalApplications: apps.length || 0,
          shortlisted: shortlistedCount,
          thisMonth: thisMonthCount,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Active Jobs",
      value: stats.activeJobs.toString(),
      icon: Briefcase,
      description: "Currently open positions",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications.toString(),
      icon: Users,
      description: "All time applications",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted.toString(),
      icon: UserCheck,
      description: "Candidates in pipeline",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "This Month",
      value: stats.thisMonth.toString(),
      icon: TrendingUp,
      description: "New applications",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivity = [
    // Sample data - will be replaced with real data
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your recruitment today.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/jobs/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest job postings</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/jobs">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-sm">No jobs created yet</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/jobs/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first job
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest candidate applications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/candidates">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-sm">No applications yet</p>
              <p className="text-xs text-gray-400 mt-2">
                Applications will appear here once candidates apply
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              asChild
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <Link href="/admin/jobs/create">
                <div className="flex items-center mb-2">
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Create Job</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Post a new job opening with AI-generated description
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <Link href="/admin/jobs">
                <div className="flex items-center mb-2">
                  <Briefcase className="mr-2 h-5 w-5" />
                  <span className="font-semibold">View Jobs</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Manage all your job postings
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <Link href="/admin/candidates">
                <div className="flex items-center mb-2">
                  <Users className="mr-2 h-5 w-5" />
                  <span className="font-semibold">View Candidates</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Review and manage applications
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Getting Started</CardTitle>
          <CardDescription className="text-blue-700">
            Follow these steps to set up your recruitment process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  Create your first job
                </p>
                <p className="text-xs text-blue-700">
                  Use AI to generate professional job descriptions
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="shrink-0 h-6 w-6 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  Share the job posting
                </p>
                <p className="text-xs text-blue-700">
                  Candidates can browse and apply through the public portal
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="shrink-0 h-6 w-6 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  Review AI-ranked candidates
                </p>
                <p className="text-xs text-blue-700">
                  See candidates ranked by AI match scores
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
