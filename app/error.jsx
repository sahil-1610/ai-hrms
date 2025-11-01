"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <AlertCircle className="h-24 w-24 text-red-500 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 mb-2">Oops!</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-2">
            We encountered an unexpected error. This has been logged and
            we&apos;ll look into it.
          </p>
          {error?.message && (
            <p className="text-sm text-gray-500 font-mono bg-gray-100 p-3 rounded-lg max-w-md mx-auto mb-8">
              Error: {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            If the problem persists, please contact support at{" "}
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:underline"
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
