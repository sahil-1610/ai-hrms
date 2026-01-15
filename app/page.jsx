import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-950 shadow-sm border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                AI-HRMS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/jobs"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Browse Jobs
              </Link>
              <Link
                href="/auth/signin"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <ModeToggle />
              <Link
                href="/jobs"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white sm:text-6xl md:text-7xl">
            AI-Powered HRMS
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Transform your recruitment process with intelligent automation.
            AI-powered resume parsing, candidate matching, and performance
            tracking.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/jobs"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Browse Jobs
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
            >
              HR Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-4">
                🤖
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                AI Resume Parsing
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automatically extract and structure candidate information from
                resumes using advanced AI technology.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-4">
                🎯
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                Smart Matching
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI-powered semantic matching between job descriptions and
                candidate profiles for perfect fits.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-4">
                📊
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                Automated Testing
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate and auto-grade technical MCQ tests tailored to each job
                role.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border dark:border-gray-700">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                50%
              </div>
              <div className="text-gray-600 dark:text-gray-300 mt-2">
                Time Saved
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                90%
              </div>
              <div className="text-gray-600 dark:text-gray-300 mt-2">
                Accuracy
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                3x
              </div>
              <div className="text-gray-600 dark:text-gray-300 mt-2">
                Faster Hiring
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                100%
              </div>
              <div className="text-gray-600 dark:text-gray-300 mt-2">
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            © 2025 AI-HRMS. Built by Sahil Tiwari. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
