import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitMate — share expenses",
  description: "Split bills with friends and groups, and see who owes whom.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
