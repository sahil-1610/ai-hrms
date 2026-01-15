import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, MapPin, Clock, DollarSign, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCompanySettings() {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select("*")
    .single();
  return data;
}

async function getPublishedJobs() {
  const { data } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function generateMetadata() {
  const settings = await getCompanySettings();
  return {
    title: settings?.meta_title || `Careers at ${settings?.company_name || "Company"}`,
    description: settings?.meta_description || settings?.company_description,
  };
}

export default async function CareersPage() {
  const [settings, jobs] = await Promise.all([
    getCompanySettings(),
    getPublishedJobs(),
  ]);

  if (!settings?.career_page_enabled) {
    notFound();
  }

  const primaryColor = settings.primary_color || "#3B82F6";
  const secondaryColor = settings.secondary_color || "#8B5CF6";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings.background_color || "#F9FAFB" }}
    >
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.company_name}
                  className="h-10 object-contain"
                />
              ) : (
                <Building2
                  className="h-8 w-8"
                  style={{ color: primaryColor }}
                />
              )}
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {settings.company_name}
              </span>
            </div>
            {settings.company_website && (
              <a
                href={settings.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                Visit Website →
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className="relative py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {settings.hero_image_url && (
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.hero_image_url})` }}
          />
        )}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {settings.hero_title || "Join Our Team"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {settings.hero_subtitle ||
              "Discover exciting opportunities and grow your career with us"}
          </p>
          <div className="mt-8">
            <a
              href="#jobs"
              className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Open Positions ({jobs.length})
            </a>
          </div>
        </div>
      </div>

      {/* Company Description */}
      {settings.company_description && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8 border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About {settings.company_name}
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {settings.company_description}
            </p>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      {settings.show_company_benefits &&
        settings.benefits &&
        settings.benefits.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm p-8 border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Work With Us
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Jobs Section */}
      <div id="jobs" className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Open Positions
        </h2>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Open Positions
            </h3>
            <p className="text-gray-500">
              We don't have any open positions right now, but check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/careers/jobs/${job.id}`}>
                <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3
                        className="text-xl font-semibold group-hover:underline"
                        style={{ color: primaryColor }}
                      >
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.experience_min}-{job.experience_max} years
                        </span>
                        {job.number_of_positions && job.number_of_positions > 1 && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.number_of_positions} positions
                          </span>
                        )}
                        {job.job_type && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.job_type.replace("_", " ")}
                          </span>
                        )}
                        {settings.show_salary_ranges &&
                          (job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary_min && job.salary_max
                                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                                : job.salary_min
                                ? `From $${job.salary_min.toLocaleString()}`
                                : `Up to $${job.salary_max.toLocaleString()}`}
                            </span>
                          )}
                      </div>
                      {job.short_description && (
                        <p className="mt-3 text-gray-600 line-clamp-2">
                          {job.short_description}
                        </p>
                      )}
                    </div>
                    <div
                      className="ml-4 px-4 py-2 rounded-lg text-white font-medium text-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Apply
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Social Links */}
      {(settings.linkedin_url || settings.twitter_url || settings.glassdoor_url) && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Connect with us</p>
            <div className="flex justify-center gap-4">
              {settings.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white rounded-full shadow-sm border hover:shadow-md transition-shadow"
                >
                  <svg className="h-5 w-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {settings.twitter_url && (
                <a
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white rounded-full shadow-sm border hover:shadow-md transition-shadow"
                >
                  <svg className="h-5 w-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
              {settings.glassdoor_url && (
                <a
                  href={settings.glassdoor_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white rounded-full shadow-sm border hover:shadow-md transition-shadow"
                >
                  <svg className="h-5 w-5 text-[#0CAA41]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {settings.company_name}. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Powered by AI-HRMS
          </p>
        </div>
      </footer>
    </div>
  );
}
