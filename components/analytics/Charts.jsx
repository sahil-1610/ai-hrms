"use client";

import { useTheme } from "next-themes";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ef4444", "#06b6d4"];

// Custom tooltip styles for dark mode support
const useTooltipStyles = () => {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;
    const isDark = currentTheme === "dark";

    return {
        backgroundColor: isDark ? "#1f2937" : "#fff",
        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
        borderRadius: "8px",
        color: isDark ? "#f3f4f6" : "#111827",
    };
};

const useAxisColor = () => {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;
    return currentTheme === "dark" ? "#9ca3af" : "#6b7280";
};

const useGridColor = () => {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;
    return currentTheme === "dark" ? "#374151" : "#e5e7eb";
};

// Applications over time chart
export function ApplicationsChart({ data }) {
    const tooltipStyles = useTooltipStyles();
    const axisColor = useAxisColor();
    const gridColor = useGridColor();

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Applications Trend</CardTitle>
                    <CardDescription>Applications received over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No application data available yet
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Applications Trend</CardTitle>
                <CardDescription>Applications received over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis
                                dataKey="date"
                                stroke={axisColor}
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={axisColor}
                                fontSize={12}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip contentStyle={tooltipStyles} />
                            <Line
                                type="monotone"
                                dataKey="applications"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Application status breakdown pie chart
export function StatusBreakdownChart({ data }) {
    const tooltipStyles = useTooltipStyles();

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Status Breakdown</CardTitle>
                    <CardDescription>Application status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No status data available yet
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Filter out zero values
    const filteredData = data.filter(d => d.value > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>Application status distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={filteredData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [value, "Applications"]}
                                contentStyle={tooltipStyles}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Top jobs by applications bar chart
export function TopJobsChart({ data }) {
    const tooltipStyles = useTooltipStyles();
    const axisColor = useAxisColor();
    const gridColor = useGridColor();

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top Jobs by Applications</CardTitle>
                    <CardDescription>Most popular job postings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No job data available yet
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Jobs by Applications</CardTitle>
                <CardDescription>Most popular job postings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis type="number" stroke={axisColor} fontSize={12} />
                            <YAxis
                                dataKey="title"
                                type="category"
                                width={120}
                                stroke={axisColor}
                                fontSize={12}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(value) => [value, "Applications"]}
                                contentStyle={tooltipStyles}
                            />
                            <Bar dataKey="applications" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Average match score chart
export function MatchScoreChart({ data }) {
    const tooltipStyles = useTooltipStyles();
    const axisColor = useAxisColor();
    const gridColor = useGridColor();

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Match Score Distribution</CardTitle>
                    <CardDescription>AI matching scores across applications</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No match score data available yet
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Match Score Distribution</CardTitle>
                <CardDescription>AI matching scores across applications</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="range" stroke={axisColor} fontSize={12} />
                            <YAxis stroke={axisColor} fontSize={12} allowDecimals={false} />
                            <Tooltip
                                formatter={(value) => [value, "Candidates"]}
                                contentStyle={tooltipStyles}
                            />
                            <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
