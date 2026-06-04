import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });

export const metadata: Metadata = {
  title: "The Harris County Project",
  description: "Civic tools for Harris County residents. They stopped teaching civics — we didn't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dancing.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-8 px-6 text-center text-[var(--muted)]">
          <p style={{ fontFamily: "var(--font-dancing), cursive", fontSize: "1.6rem", color: "var(--accent)" }}>
            Built By Wood
          </p>
        </footer>
      </body>
    </html>
  );
}
