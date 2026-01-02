"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Poll-by-Poll Map - 2025 Election",
//   description:
//     "Interactive, detailed map of the 2025 Canadian federal election.",
//   openGraph: {
//     title: "Poll-by-Poll Map - 2025 Election",
//     description:
//       "Interactive, detailed map of the 2025 Canadian federal election.",
//   },
//   icons: {
//     icon: "/favicon.svg",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>2025 Poll-by-Poll Results Map</title>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta
          name="description"
          content="Interactive, detailed map of the 2025 Canadian federal election."
        />
        <meta property="og:title" content="2025 Poll-by-Poll Results Map" />
        <meta
          property="og:description"
          content="Interactive, detailed map of the 2025 Canadian federal election."
        />
        <meta
          property="og:image"
          content="https://e25.noratastic.ca/favicon.svg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="600" />
        <meta name="theme-color" content="#EF3340" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen p-4 sm:p-8">
          {children}
          <footer className="fixed bottom-0 left-0 right-0 text-center text-sm text-muted-foreground p-4 bg-background">
            <div className="flex items-center justify-center gap-4">
              <p>
                Data from{" "}
                <Link
                  href="https://www.elections.ca/res/rep/off/ovrGE45/home.html"
                  className="hover:underline">
                  Elections Canada
                </Link>
              </p>
              <span>•</span>
              <p>
                <Link
                  href="https://github.com/mew/election-2025-map"
                  className="hover:underline">
                  Source Code
                </Link>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
