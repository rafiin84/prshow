import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: { default: "PR Show — Beyond the Screen", template: "%s · PR Show" },
  description: "The official fan community for Pradeep Ranganathan. Demo build with simulated services.",
  manifest: "/manifest.webmanifest",
  applicationName: "PR Show",
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbf7f0" }, { media: "(prefers-color-scheme: dark)", color: "#0d0b10" }], width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
