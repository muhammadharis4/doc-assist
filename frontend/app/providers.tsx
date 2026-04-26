/**
 * Client wrapper: MUI `ThemeProvider` + `CssBaseline`.
 * Theme definition lives in `@/lib/theme`.
 */
"use client";

import { useMemo, type ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme } from "@/lib/theme";

/**
 * Wraps the app in MUI’s theme and global baseline (fonts, default colors, `body` background).
 * @param children - App routes and layouts.
 * @returns Children wrapped in `ThemeProvider` and `CssBaseline`.
 */
export function AppProviders({ children }: { children: ReactNode }) {
    const theme = useMemo(() => createAppTheme("dark"), []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </ThemeProvider>
    );
}
