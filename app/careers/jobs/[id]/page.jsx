import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  ArrowLeft,
  Users,
  Building2,
  CheckCircle2,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getJob(id) {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data;
}

async function getCompanySettings() {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select("*")
    .single();
  return data;
}

async function getApplicationCount(jobId) {
  const { count } = await supabaseAdmin
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);
  return count || 0;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const job = await getJob(id);
  const settings = await getCompanySettings();

  if (!job) {
    return { title: "Job Not Found" };
  }

  return {
    title: `${job.title} - ${settings?.company_name || "Careers"}`,
    description: job.description?.substring(0, 160),
  };
}

export default async function CareersJobDetailPage({ params }) {
  const { id } = await params;
  const [job, settings, applicationCount] = await Promise.all([
    getJob(id),
    getCompanySettings(),
    getApplicationCount(id),
  ]);

  if (!job) {
    notFound();
  }

  const primaryColor = settings?.primary_color || "#3B82F6";
  const secondaryColor = settings?.secondary_color || "#8B5CF6";

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const formatNumber = (num) => {
      if (num >= 100000) return `$${(num / 1000).toFixed(0)}k`;
      return `$${num.toLocaleString()}`;
    };
    if (min && max) return `${formatNumber(min)} - ${formatNumber(max)}`;
    if (min) return `From ${formatNumber(min)}`;
    if (max) return `Up to ${formatNumber(max)}`;
  };

  const salaryDisplay = formatSalary(job.salary_min, job.salary_max);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings?.background_color || "#F9FAFB" }}
    >
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.company_name}
                  className="h-10 object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
              )}
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {settings?.company_name || "Company"}
              </span>
            </div>
            <Link
              href="/careers"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Jobs
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className="relative py-16 px-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="text-white">
              <Link
                href="/careers"
                className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all positions
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-white/90">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-5 w-5" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  {job.experience_min}-{job.experience_max} years
                </span>
                {salaryDisplay && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    {salaryDisplay}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-5 w-5" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                {job.number_of_positions && job.number_of_positions > 1 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-5 w-5" />
                    {job.number_of_positions} positions available
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/careers/jobs/${job.id}/apply`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg text-lg shrink-0"
            >
              <Send className="h-5 w-5" />
              Apply Now
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                About This Role
              </h2>
              <div className="prose prose-gray max-w-none">
                {job.description ? (
                  job.description.split("\n").map((paragraph, index) =>
                    paragraph.trim() ? (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ) : null
                  )
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-3">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {settings?.show_company_benefits &&
              settings?.benefits &&
              settings.benefits.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8 border">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Why Join Us
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {settings.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ backgroundColor: `${secondaryColor}10` }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: secondaryColor }}
                        />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Job Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock
                    className="h-5 w-5 mt-0.5"
                    style={{ color: primaryColor }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">
                      {job.experience_min}-{job.experience_max} years
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    className="h-5 w-5 mt-0.5"
                    style={{ color: primaryColor }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{job.location}</p>
                  </div>
                </div>
                {salaryDisplay && (
                  <div className="flex items-start gap-3">
                    <DollarSign
                      className="h-5 w-5 mt-0.5"
                      style={{ color: primaryColor }}
                    />
                    <div>
                      <p className="text-sm text-gray-500">Salary</p>
                      <p className="font-medium">{salaryDisplay}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Users
                    className="h-5 w-5 mt-0.5"
                    style={{ color: primaryColor }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Applicants</p>
                    <p className="font-medium">{applicationCount} candidates</p>
                  </div>
                </div>
                {job.number_of_positions && job.number_of_positions > 1 && (
                  <div className="flex items-start gap-3">
                    <Briefcase
                      className="h-5 w-5 mt-0.5"
                      style={{ color: primaryColor }}
                    />
                    <div>
                      <p className="text-sm text-gray-500">Open Positions</p>
                      <p className="font-medium">{job.number_of_positions} positions</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link
                  href={`/careers/jobs/${job.id}/apply`}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="h-5 w-5" />
                  Apply for this job
                </Link>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Takes less than 5 minutes
                </p>
              </div>
            </div>

            {/* Company Info */}
            {settings?.company_name && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About {settings.company_name}
                </h3>
                {settings.company_description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {settings.company_description.length > 200
                      ? `${settings.company_description.substring(0, 200)}...`
                      : settings.company_description}
                  </p>
                )}
                {settings.company_website && (
                  <a
                    href={settings.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {settings?.company_name || "Company"}. All
            rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">Powered by AI-HRMS</p>
        </div>
      </footer>
    </div>
  );
}
