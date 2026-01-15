import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Branding */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-xl bg-blue-600 p-3 shadow-lg">
            <span className="text-4xl text-white">🤖</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            AI-HRMS
          </h1>
        </div>

        {/* Hero Text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 sm:text-3xl">
            Transform your recruitment process with intelligent automation
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400">
            AI-powered resume parsing, candidate matching, and performance tracking tailored for modern HR teams.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 sm:justify-center">
          <Link href="/auth/signin" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:scale-105">
              Get Started
            </Button>
          </Link>
          <Link href="/jobs" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold shadow-sm transition-all hover:scale-105">
              Browse Jobs
            </Button>
          </Link>
        </div>

        {/* Footer/Legal */}
        <div className="pt-8">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-900 dark:hover:text-gray-300">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-900 dark:hover:text-gray-300">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
