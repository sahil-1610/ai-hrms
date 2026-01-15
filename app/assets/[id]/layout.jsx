import { supabaseAdmin } from "@/lib/supabase";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const { data: asset } = await supabaseAdmin
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (!asset) {
      return {
        title: "Asset Not Found",
        description: "The requested asset could not be found.",
      };
    }

    const isImage = asset.type === "image";

    return {
      title: asset.name,
      description: asset.description || `View ${asset.type}: ${asset.name}`,
      openGraph: {
        title: asset.name,
        description: asset.description || `View ${asset.type}: ${asset.name}`,
        type: isImage ? "article" : "website",
        images: isImage ? [{ url: asset.url, alt: asset.name }] : [],
      },
      twitter: {
        card: isImage ? "summary_large_image" : "summary",
        title: asset.name,
        description: asset.description || `View ${asset.type}: ${asset.name}`,
        images: isImage ? [asset.url] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Asset Viewer",
      description: "View and download assets",
    };
  }
}

export default function AssetLayout({ children }) {
  return children;
}
