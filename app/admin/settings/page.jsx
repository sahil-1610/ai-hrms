"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2,
  Palette,
  Globe,
  Calendar,
  Save,
  Plus,
  X,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [fathomTesting, setFathomTesting] = useState(false);
  const [showFathomApiKey, setShowFathomApiKey] = useState(false);
  const [hrUser, setHrUser] = useState(null);

  const [settings, setSettings] = useState({
    company_name: "",
    company_tagline: "",
    company_description: "",
    company_website: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#8B5CF6",
    background_color: "#F9FAFB",
    career_page_enabled: true,
    career_page_slug: "careers",
    show_salary_ranges: true,
    show_company_benefits: true,
    benefits: [],
    linkedin_url: "",
    twitter_url: "",
    glassdoor_url: "",
    meta_title: "",
    meta_description: "",
    hero_title: "Join Our Team",
    hero_subtitle: "Discover exciting opportunities and grow your career with us",
    hero_image_url: "",
    fathom_api_key: "",
    fathom_webhook_secret: "",
    fathom_enabled: false,
  });

  const [newBenefit, setNewBenefit] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchSettings();
      fetchHrUser();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/company/settings");
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setSettings({
            ...settings,
            ...data,
            benefits: data.benefits || [],
          });
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHrUser = async () => {
    try {
      const response = await fetch("/api/hr/me");
      if (response.ok) {
        const data = await response.json();
        setHrUser(data);
      }
    } catch (error) {
      console.error("Error fetching HR user:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/company/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleConnecting(true);
    try {
      const response = await fetch("/api/auth/google/connect");
      if (!response.ok) throw new Error("Failed to get auth URL");

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting Google:", error);
      toast.error("Failed to connect Google Calendar");
      setGoogleConnecting(false);
    }
  };

  const handleTestFathom = async () => {
    if (!settings.fathom_api_key) {
      toast.error("Please enter your Fathom API key first");
      return;
    }
    setFathomTesting(true);
    try {
      const response = await fetch("/api/fathom/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: settings.fathom_api_key }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Fathom connection successful!");
        setSettings({ ...settings, fathom_enabled: true });
      } else {
        throw new Error(data.error || "Failed to connect");
      }
    } catch (error) {
      console.error("Error testing Fathom:", error);
      toast.error(error.message || "Failed to connect to Fathom");
      setSettings({ ...settings, fathom_enabled: false });
    } finally {
      setFathomTesting(false);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setSettings({
        ...settings,
        benefits: [...settings.benefits, newBenefit.trim()],
      });
      setNewBenefit("");
    }
  };

  const removeBenefit = (index) => {
    setSettings({
      ...settings,
      benefits: settings.benefits.filter((_, i) => i !== index),
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your company profile and career page
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="career">
              <Globe className="h-4 w-4 mr-2" />
              Career Page
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Calendar className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Basic information about your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name}
                      onChange={(e) =>
                        setSettings({ ...settings, company_name: e.target.value })
                      }
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_website">Website</Label>
                    <Input
                      id="company_website"
                      value={settings.company_website}
                      onChange={(e) =>
                        setSettings({ ...settings, company_website: e.target.value })
                      }
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_tagline">Tagline</Label>
                  <Input
                    id="company_tagline"
                    value={settings.company_tagline}
                    onChange={(e) =>
                      setSettings({ ...settings, company_tagline: e.target.value })
                    }
                    placeholder="Your company tagline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_description">Description</Label>
                  <Textarea
                    id="company_description"
                    value={settings.company_description}
                    onChange={(e) =>
                      setSettings({ ...settings, company_description: e.target.value })
                    }
                    placeholder="Tell candidates about your company..."
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Company Benefits</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add a benefit (e.g., Remote work, Health insurance)"
                      onKeyDown={(e) => e.key === "Enter" && addBenefit()}
                    />
                    <Button type="button" onClick={addBenefit}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm"
                      >
                        {benefit}
                        <button
                          onClick={() => removeBenefit(index)}
                          className="hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      value={settings.linkedin_url}
                      onChange={(e) =>
                        setSettings({ ...settings, linkedin_url: e.target.value })
                      }
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <Input
                      id="twitter_url"
                      value={settings.twitter_url}
                      onChange={(e) =>
                        setSettings({ ...settings, twitter_url: e.target.value })
                      }
                      placeholder="Twitter URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="glassdoor_url">Glassdoor</Label>
                    <Input
                      id="glassdoor_url"
                      value={settings.glassdoor_url}
                      onChange={(e) =>
                        setSettings({ ...settings, glassdoor_url: e.target.value })
                      }
                      placeholder="Glassdoor URL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize the look and feel of your career page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={settings.logo_url}
                      onChange={(e) =>
                        setSettings({ ...settings, logo_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">Favicon URL</Label>
                    <Input
                      id="favicon_url"
                      value={settings.favicon_url}
                      onChange={(e) =>
                        setSettings({ ...settings, favicon_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="primary_color"
                        value={settings.primary_color}
                        onChange={(e) =>
                          setSettings({ ...settings, primary_color: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.primary_color}
                        onChange={(e) =>
                          setSettings({ ...settings, primary_color: e.target.value })
                        }
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="secondary_color"
                        value={settings.secondary_color}
                        onChange={(e) =>
                          setSettings({ ...settings, secondary_color: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.secondary_color}
                        onChange={(e) =>
                          setSettings({ ...settings, secondary_color: e.target.value })
                        }
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="background_color"
                        value={settings.background_color}
                        onChange={(e) =>
                          setSettings({ ...settings, background_color: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.background_color}
                        onChange={(e) =>
                          setSettings({ ...settings, background_color: e.target.value })
                        }
                        placeholder="#F9FAFB"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border dark:border-gray-700">
                  <h4 className="font-medium mb-3 dark:text-white">Preview</h4>
                  <div
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: settings.background_color }}
                  >
                    <div
                      className="text-2xl font-bold mb-2"
                      style={{ color: settings.primary_color }}
                    >
                      {settings.company_name || "Your Company"}
                    </div>
                    <div
                      className="text-lg"
                      style={{ color: settings.secondary_color }}
                    >
                      {settings.company_tagline || "Your tagline here"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Page Tab */}
          <TabsContent value="career">
            <Card>
              <CardHeader>
                <CardTitle>Career Page Settings</CardTitle>
                <CardDescription>
                  Configure your public career page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border dark:border-gray-700">
                  <div>
                    <h4 className="font-medium dark:text-white">Enable Career Page</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Make your career page publicly accessible
                    </p>
                  </div>
                  <Switch
                    checked={settings.career_page_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, career_page_enabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="career_page_slug">Career Page URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      {typeof window !== "undefined" ? window.location.origin : ""}/
                    </span>
                    <Input
                      id="career_page_slug"
                      value={settings.career_page_slug}
                      onChange={(e) =>
                        setSettings({ ...settings, career_page_slug: e.target.value })
                      }
                      placeholder="careers"
                      className="max-w-[200px]"
                    />
                    {settings.career_page_enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/${settings.career_page_slug}`, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border dark:border-gray-700">
                    <div>
                      <h4 className="font-medium dark:text-white">Show Salary Ranges</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Display salary on job listings
                      </p>
                    </div>
                    <Switch
                      checked={settings.show_salary_ranges}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, show_salary_ranges: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border dark:border-gray-700">
                    <div>
                      <h4 className="font-medium dark:text-white">Show Benefits</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Display company benefits
                      </p>
                    </div>
                    <Switch
                      checked={settings.show_company_benefits}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, show_company_benefits: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium dark:text-white">Hero Section</h4>
                  <div className="space-y-2">
                    <Label htmlFor="hero_title">Hero Title</Label>
                    <Input
                      id="hero_title"
                      value={settings.hero_title}
                      onChange={(e) =>
                        setSettings({ ...settings, hero_title: e.target.value })
                      }
                      placeholder="Join Our Team"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                    <Textarea
                      id="hero_subtitle"
                      value={settings.hero_subtitle}
                      onChange={(e) =>
                        setSettings({ ...settings, hero_subtitle: e.target.value })
                      }
                      placeholder="Discover exciting opportunities..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_image_url">Hero Image URL</Label>
                    <Input
                      id="hero_image_url"
                      value={settings.hero_image_url}
                      onChange={(e) =>
                        setSettings({ ...settings, hero_image_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium dark:text-white">SEO Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={settings.meta_title}
                      onChange={(e) =>
                        setSettings({ ...settings, meta_title: e.target.value })
                      }
                      placeholder="Careers at Your Company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={settings.meta_description}
                      onChange={(e) =>
                        setSettings({ ...settings, meta_description: e.target.value })
                      }
                      placeholder="Explore career opportunities at..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect third-party services for enhanced functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Calendar Integration */}
                <div className="p-6 rounded-lg border dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                        <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white">
                          Google Calendar & Meet
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Automatically create calendar events and Google Meet links
                          for interviews
                        </p>
                        {hrUser?.google_email && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            Connected as {hrUser.google_email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={hrUser?.google_email ? "outline" : "default"}
                      onClick={handleConnectGoogle}
                      disabled={googleConnecting}
                    >
                      {googleConnecting
                        ? "Connecting..."
                        : hrUser?.google_email
                        ? "Reconnect"
                        : "Connect"}
                    </Button>
                  </div>
                </div>

                {/* Fathom AI Integration */}
                <div className="p-6 rounded-lg border dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                        <svg
                          className="h-6 w-6 text-purple-600 dark:text-purple-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white">Fathom AI</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          AI-powered interview summaries, transcripts, and insights
                        </p>
                        {settings.fathom_enabled && settings.fathom_api_key && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            Connected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4 pt-4 border-t dark:border-gray-700">
                    <div className="space-y-2">
                      <Label htmlFor="fathom_api_key">Fathom API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="fathom_api_key"
                            type={showFathomApiKey ? "text" : "password"}
                            value={settings.fathom_api_key}
                            onChange={(e) =>
                              setSettings({ ...settings, fathom_api_key: e.target.value })
                            }
                            placeholder="ft_..."
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFathomApiKey(!showFathomApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showFathomApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleTestFathom}
                          disabled={fathomTesting || !settings.fathom_api_key}
                        >
                          {fathomTesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get your API key from{" "}
                        <a
                          href="https://fathom.video/settings/api"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Fathom Settings
                        </a>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fathom_webhook_secret">Webhook Secret (Optional)</Label>
                      <Input
                        id="fathom_webhook_secret"
                        type="password"
                        value={settings.fathom_webhook_secret}
                        onChange={(e) =>
                          setSettings({ ...settings, fathom_webhook_secret: e.target.value })
                        }
                        placeholder="For webhook signature verification"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Webhook URL:{" "}
                        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/api/fathom/webhook`
                            : "/api/fathom/webhook"}
                        </code>
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div>
                        <h5 className="font-medium text-sm dark:text-white">
                          Enable Fathom Integration
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Automatically sync interview recordings and transcripts
                        </p>
                      </div>
                      <Switch
                        checked={settings.fathom_enabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, fathom_enabled: checked })
                        }
                        disabled={!settings.fathom_api_key}
                      />
                    </div>
                  </div>
                </div>

                {/* Email Provider */}
                <div className="p-6 rounded-lg border dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <svg
                          className="h-6 w-6 text-blue-600 dark:text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white">Email Provider</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Configure SMTP settings for sending emails
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" />
                          Configured via environment variables
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      View Docs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
