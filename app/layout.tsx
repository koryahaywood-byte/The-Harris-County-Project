import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Harris County Project",
  description: "Civic tools for Harris County residents. They stopped teaching civics — we didn't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-8 px-6 text-center text-sm text-[var(--muted)]">
          <p>Harris County Project — civic tools built for the people who live here.</p>
        </footer>
      </body>
    </html>
  );
}
