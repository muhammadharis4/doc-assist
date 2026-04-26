/**
 * Client wrapper: MUI `ThemeProvider` + `CssBaseline`.
 * Theme definition lives in `@/lib/theme`.
 */
"use client";

import { useMemo, type ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme } from "@/lib/theme";

export function AppProviders({ children }: { children: ReactNode }) {
    const theme = useMemo(() => createAppTheme("dark"), []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </ThemeProvider>
    );
}
