"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, FileSearch, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StatusPage() {
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!token.trim()) {
            setError("Please enter your application token");
            return;
        }

        if (token.trim().length < 10) {
            setError("Invalid token format. Please check your email for the correct token.");
            return;
        }

        router.push(`/status/${token.trim()}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <FileSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Track Your Application
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Enter your application token to check the status of your job application.
                        You received this token in your confirmation email after applying.
                    </p>
                </div>

                {/* Token Input Card */}
                <div className="max-w-md mx-auto">
                    <Card className="shadow-xl border-0 dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-xl dark:text-white">
                                Application Status Lookup
                            </CardTitle>
                            <CardDescription className="dark:text-gray-400">
                                Enter the token from your confirmation email
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="token" className="dark:text-gray-300">
                                        Application Token
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="token"
                                            type="text"
                                            placeholder="e.g., a1b2c3d4e5f6..."
                                            value={token}
                                            onChange={(e) => {
                                                setToken(e.target.value);
                                                setError("");
                                            }}
                                            className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full gap-2">
                                    Check Status
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="mt-6 pt-6 border-t dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    Don't have a token?{" "}
                                    <Link
                                        href="/jobs"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Browse open positions
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Help Section */}
                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p className="mb-2">
                            <strong>Can't find your token?</strong>
                        </p>
                        <p>
                            Check your email inbox (and spam folder) for an email with the subject
                            "Application Received" from AI HRMS.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
