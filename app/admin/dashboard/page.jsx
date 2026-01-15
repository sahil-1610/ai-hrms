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
import {
  ApplicationsChart,
  StatusBreakdownChart,
  TopJobsChart,
  MatchScoreChart,
} from "@/components/analytics/Charts";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    thisMonth: 0,
  });
  const [chartData, setChartData] = useState({
    applicationsOverTime: [],
    statusBreakdown: [],
    topJobs: [],
    matchScoreDistribution: [],
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/applications"),
      ]);

      const jobs = await jobsRes.json();
      const apps = await appsRes.json();

      if (jobsRes.ok && appsRes.ok) {
        // Calculate basic stats
        const activeJobs = Array.isArray(jobs) ? jobs.filter(j => j.status === "active") : [];
        const shortlistedCount = apps.filter((app) => app.status === "shortlisted").length;

        const now = new Date();
        const thisMonthCount = apps.filter((app) => {
          const appDate = new Date(app.created_at);
          return (
            appDate.getMonth() === now.getMonth() &&
            appDate.getFullYear() === now.getFullYear()
          );
        }).length;

        setStats({
          activeJobs: activeJobs.length || 0,
          totalApplications: apps.length || 0,
          shortlisted: shortlistedCount,
          thisMonth: thisMonthCount,
        });

        // Set recent items
        setRecentJobs(Array.isArray(jobs) ? jobs.slice(0, 5) : []);
        setRecentApplications(apps.slice(0, 5));

        // Prepare chart data
        prepareChartData(apps, jobs);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (applications, jobs) => {
    // Applications over time (last 30 days)
    const last30Days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const count = applications.filter((app) => {
        const appDate = new Date(app.created_at);
        return (
          appDate.toDateString() === date.toDateString()
        );
      }).length;

      last30Days.push({ date: dateStr, applications: count });
    }

    // Status breakdown
    const statusCounts = {
      submitted: 0,
      shortlisted: 0,
      interviewing: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
    };
    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });
    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Top jobs by applications
    const jobApplicationCounts = {};
    applications.forEach((app) => {
      const jobId = app.job_id;
      if (!jobApplicationCounts[jobId]) {
        jobApplicationCounts[jobId] = { count: 0, title: "" };
      }
      jobApplicationCounts[jobId].count++;
    });

    // Match job titles
    const jobsArray = Array.isArray(jobs) ? jobs : [];
    jobsArray.forEach((job) => {
      if (jobApplicationCounts[job.id]) {
        jobApplicationCounts[job.id].title = job.title.length > 20
          ? job.title.substring(0, 20) + "..."
          : job.title;
      }
    });

    const topJobs = Object.values(jobApplicationCounts)
      .filter((j) => j.title)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((j) => ({ title: j.title, applications: j.count }));

    // Match score distribution
    const scoreRanges = [
      { range: "0-20%", min: 0, max: 20, count: 0 },
      { range: "21-40%", min: 21, max: 40, count: 0 },
      { range: "41-60%", min: 41, max: 60, count: 0 },
      { range: "61-80%", min: 61, max: 80, count: 0 },
      { range: "81-100%", min: 81, max: 100, count: 0 },
    ];
    applications.forEach((app) => {
      const score = app.resume_match_score || 0;
      const range = scoreRanges.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    setChartData({
      applicationsOverTime: last30Days,
      statusBreakdown,
      topJobs,
      matchScoreDistribution: scoreRanges.map((r) => ({ range: r.range, count: r.count })),
    });
  };

  const statsCards = [
    {
      title: "Active Jobs",
      value: stats.activeJobs.toString(),
      icon: Briefcase,
      description: "Currently open positions",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications.toString(),
      icon: Users,
      description: "All time applications",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted.toString(),
      icon: UserCheck,
      description: "Candidates in pipeline",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "This Month",
      value: stats.thisMonth.toString(),
      icon: TrendingUp,
      description: "New applications",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Charts Grid */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2">
          <ApplicationsChart data={chartData.applicationsOverTime} />
          <StatusBreakdownChart data={chartData.statusBreakdown} />
          <TopJobsChart data={chartData.topJobs} />
          <MatchScoreChart data={chartData.matchScoreDistribution} />
        </div>
      )}

      {/* Recent Items Grid */}
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
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link key={job.id} href={`/admin/jobs/${job.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{job.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{job.location}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                        {job.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Briefcase className="mx-auto h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-sm">No jobs created yet</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/admin/jobs/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first job
                  </Link>
                </Button>
              </div>
            )}
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
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{app.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {app.resume_match_score || 0}%
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${app.status === 'shortlisted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="mx-auto h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-sm">No applications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Applications will appear here once candidates apply
                </p>
              </div>
            )}
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
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
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

            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
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

            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-start">
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
    </div>
  );
}
