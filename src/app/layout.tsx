import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AeroAddons — Create Aeronautics addon directory",
  description:
    "Find every addon for Create Aeronautics and Sable: vehicles, parts, compatibility patches and more, updated automatically from Modrinth.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <nav className="border-b border-line">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold tracking-tight">
              <span className="text-brass">Aero</span>Addons
            </Link>
            <Link href="/about" className="text-sm text-subtle hover:text-fg">
              About
            </Link>
          </div>
        </nav>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-subtle">
            Unofficial fan project. Not affiliated with the Create team or the
            Simulated team. Addon data comes from the{" "}
            <a href="https://docs.modrinth.com/api/" className="underline hover:text-fg">
              Modrinth API
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
