"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
  Calendar,
} from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setJob(data);
      } else {
        console.error("Job not found");
        router.push("/jobs");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Competitive salary";
    const formatNumber = (num) => {
      if (num >= 100000) return `$${(num / 1000).toFixed(0)}k`;
      return `$${num.toLocaleString()}`;
    };
    if (min && max) return `${formatNumber(min)} - ${formatNumber(max)}`;
    if (min) return `From ${formatNumber(min)}`;
    if (max) return `Up to ${formatNumber(max)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Button asChild>
            <Link href="/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {job.experience_min}-{job.experience_max} years experience
                </span>
                <span className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button size="lg" asChild className="ml-4">
              <Link href={`/jobs/${job.id}/apply`}>Apply Now</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {job.description.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Experience Required
                  </p>
                  <p className="text-base font-semibold">
                    {job.experience_min} - {job.experience_max} years
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-base font-semibold">{job.location}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Salary Range
                  </p>
                  <p className="text-base font-semibold">
                    {formatSalary(job.salary_min, job.salary_max)}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Applicants
                  </p>
                  <p className="text-base font-semibold">
                    {job.applicationCount || 0} candidates applied
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Apply CTA */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Briefcase className="mx-auto h-12 w-12 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Ready to Apply?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Our AI will help match your skills with this position
                    </p>
                  </div>
                  {session ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/jobs/${job.id}/apply`}>Apply Now</Link>
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild className="w-full" size="lg">
                        <Link href="/auth/signin">Sign In to Apply</Link>
                      </Button>
                      <p className="text-xs text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link
                          href="/auth/signup"
                          className="text-blue-600 hover:underline"
                        >
                          Sign up
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
