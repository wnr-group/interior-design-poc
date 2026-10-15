import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Larkspur Planner - design your room", template: "%s - Larkspur" },
  description: "Plan, visualise and furnish your room in 3D before you buy. A Larkspur Home design prototype.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

/**
 * Document shell only. The shop chrome (utility bar, header, footer) lives in
 * app/(site)/layout.tsx so the full-screen room designer can go without it.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={noto.variable}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-50 bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
