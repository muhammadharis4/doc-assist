/**
 * Client wrapper: MUI `ThemeProvider` (light/dark color schemes, persisted) and `CssBaseline`.
 */
"use client";

import type { ReactNode } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { appTheme } from "@/libs/theme";

/**
 * Wraps the app in MUI’s theme provider. The mode defaults to dark and is stored in
 * `localStorage` under `docassist-theme-mode` (the key the previous custom hook used).
 * @param children - App routes and layouts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
            theme={appTheme}
            defaultMode="dark"
            modeStorageKey="docassist-theme-mode"
        >
            <CssBaseline enableColorScheme />
            {children}
        </ThemeProvider>
    );
}
