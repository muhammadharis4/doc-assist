/**
 * Root HTML shell: Geist fonts, global CSS, and `AppProviders` for the whole tree.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "./providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "DocAssist",
    description:
        "Upload German and other documents, ask in German or English, and get answers grounded in your files with source snippets.",
};

/**
 * Root layout for the whole app: HTML shell, fonts, global CSS, and the MUI theme provider.
 * @param children - The active route’s UI (the App Router `children` slot).
 * @returns A document with `<html>` / `<body>` and `AppProviders` wrapping all pages.
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
            <body suppressHydrationWarning>
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
