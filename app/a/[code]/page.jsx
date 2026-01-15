"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";

export default function AssetViewerPage() {
  const params = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.code) {
      fetchAsset();
    }
  }, [params.code]);

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/a/${params.code}`);
      const data = await response.json();

      if (response.ok) {
        setAsset(data);
      } else {
        toast.error("Asset not found");
      }
    } catch (error) {
      console.error("Error fetching asset:", error);
      toast.error("Failed to load asset");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">
              Asset Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The requested asset could not be found or the link has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isImage = asset.type === "image";
  const isPdf = asset.mime_type === "application/pdf";

  // Use proxy URL for documents to bypass Cloudinary access restrictions
  const fileUrl = isPdf ? `/api/assets/download/${asset.short_code || asset.id}` : asset.url;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                {isImage ? (
                  <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-md">
                  {asset.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(asset.size)} • {asset.mime_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy URL
              </Button>
              <Button asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {asset.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {asset.description}
          </p>
        )}

        <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            {isImage ? (
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 min-h-[60vh]">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-[80vh]">
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={asset.name}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-100 dark:bg-gray-700">
                <FileText className="h-24 w-24 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Preview not available for this file type
                </p>
                <Button asChild>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta info */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Uploaded on {new Date(asset.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
