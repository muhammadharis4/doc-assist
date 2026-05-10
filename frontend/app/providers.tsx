/**
 * Client wrapper: theme mode (`ThemeModeProvider`), MUI `ThemeProvider`, `CssBaseline`.
 */
"use client";

import { useMemo, type ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme } from "@/lib/theme";
import { ThemeModeProvider, useThemeMode } from "@/lib/theme-mode-context";

/**
 * Applies `createAppTheme(mode)` from `useThemeMode` and mounts `CssBaseline`.
 */
function AppThemeSubtree({ children }: { children: ReactNode }) {
    const { mode } = useThemeMode();
    const theme = useMemo(() => createAppTheme(mode), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </ThemeProvider>
    );
}

/**
 * Wraps the app in persisted theme mode and MUI’s theme provider.
 * @param children - App routes and layouts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeModeProvider>
            <AppThemeSubtree>{children}</AppThemeSubtree>
        </ThemeModeProvider>
    );
}
