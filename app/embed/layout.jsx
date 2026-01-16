import { Toaster } from "sonner";

export const metadata = {
  title: "Apply for Job",
  description: "Submit your job application",
};

// This layout is specifically for the embed route
// It provides a minimal wrapper without the main app's navigation
export default function EmbedLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Allow embedding in iframes */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
