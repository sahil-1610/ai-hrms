"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Loader2,
  Download,
  Eye,
  FolderOpen,
  File,
  Link as LinkIcon,
  AlertCircle,
  RefreshCw,
  Share2,
  ExternalLink,
} from "lucide-react";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function AssetCard({ asset, onDelete, onCopy }) {
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    onCopy?.(asset.url);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShareLink = () => {
    // Use short code for clean shareable URLs
    const shareUrl = asset.short_code
      ? `${window.location.origin}/a/${asset.short_code}`
      : `${window.location.origin}/assets/${asset.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    toast.success("Shareable link copied! This link shows previews when shared.");
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    setDeleting(true);
    try {
      await onDelete(asset.id);
    } finally {
      setDeleting(false);
    }
  };

  const isImage = asset.type === "image";

  return (
    <>
      <Card className="group dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
          {isImage ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowPreview(true)}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={() => window.open(asset.url, "_blank")}
            >
              <FileText className="h-16 w-16 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 uppercase">
                {asset.mime_type?.split("/")[1] || "Document"}
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopyShareLink}
              title="Copy shareable link (with preview)"
            >
              {copiedShare ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              title="Copy direct URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {isImage && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPreview(true)}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(asset.url, "_blank")}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {asset.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatFileSize(asset.size)} •{" "}
                {new Date(asset.created_at).toLocaleDateString()}
              </p>
              {asset.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {asset.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={isImage ? "default" : "secondary"} className="text-xs">
              {isImage ? "Image" : "Document"}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{asset.url.slice(0, 40)}...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{asset.name}</DialogTitle>
            <DialogDescription>{asset.description}</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <img
              src={asset.url}
              alt={asset.name}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyShareLink}>
              {copiedShare ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
              Share Link
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy URL
            </Button>
            <Button onClick={() => window.open(asset.url, "_blank")}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UploadZone({ onUpload, uploading }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setName(droppedFile.name);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setName(selectedFile.name);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name || file.name);
    formData.append("description", description);

    const success = await onUpload(formData);
    if (success) {
      setFile(null);
      setName("");
      setDescription("");
    }
  };

  const isImage = file?.type?.startsWith("image/");

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-100">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload New Asset
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Upload images or documents to use in job descriptions and other content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="asset-upload"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="asset-upload" className="cursor-pointer">
            {file ? (
              <div className="space-y-3">
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="mx-auto max-h-32 rounded-lg"
                  />
                ) : (
                  <FileText className="mx-auto h-16 w-16 text-gray-400" />
                )}
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setName("");
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Images (JPG, PNG, GIF, WebP, SVG) or Documents (PDF, DOCX) • Max 10MB
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* File Details */}
        {file && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name" className="dark:text-gray-200">
                Asset Name
              </Label>
              <Input
                id="asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter asset name"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-description" className="dark:text-gray-200">
                Description (Optional)
              </Label>
              <Textarea
                id="asset-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this asset"
                rows={2}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Asset
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AssetsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (session && session.user.role !== "hr" && session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchAssets();
  }, [session, router]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/assets");
      const data = await response.json();

      if (response.ok) {
        setAssets(data);
      } else {
        toast.error(data.error || "Failed to load assets");
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData) => {
    setUploading(true);
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Asset uploaded successfully!");
        setAssets((prev) => [data, ...prev]);
        return true;
      } else {
        toast.error(data.error || "Failed to upload asset");
        return false;
      }
    } catch (error) {
      console.error("Error uploading asset:", error);
      toast.error("Failed to upload asset");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/assets?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Asset deleted successfully");
        setAssets((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete asset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const handleCopy = (url) => {
    toast.success("URL copied to clipboard!");
  };

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === "all") return true;
    if (activeTab === "images") return asset.type === "image";
    if (activeTab === "documents") return asset.type === "document";
    return true;
  });

  const stats = {
    total: assets.length,
    images: assets.filter((a) => a.type === "image").length,
    documents: assets.filter((a) => a.type === "document").length,
    totalSize: assets.reduce((sum, a) => sum + (a.size || 0), 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-lg" />
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Asset Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload and manage images and documents for job descriptions
          </p>
        </div>
        <Button variant="outline" onClick={fetchAssets}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.images}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.documents}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <File className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatFileSize(stats.totalSize)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Zone */}
        <div>
          <UploadZone onUpload={handleUpload} uploading={uploading} />

          {/* Quick Info Card */}
          <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm dark:text-gray-100">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>1. Upload an image or document</p>
              <p>2. Click <Copy className="inline h-3 w-3 mx-1" /> to copy the direct URL</p>
              <p>3. Click <Share2 className="inline h-3 w-3 mx-1" /> for a shareable link with preview</p>
              <p>4. Paste the URL in your job description</p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  Tip: Use the Share button to get links with rich previews for Slack, WhatsApp, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets Grid */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="mr-1 h-4 w-4" />
                Images ({stats.images})
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="mr-1 h-4 w-4" />
                Documents ({stats.documents})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredAssets.length === 0 ? (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="text-center py-16">
                    <FolderOpen className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
                    <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
                      No assets found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {activeTab === "all"
                        ? "Upload your first asset to get started"
                        : `No ${activeTab} uploaded yet`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDelete={handleDelete}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
