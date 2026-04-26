"use client";

import { useMemo, type ReactNode } from "react";
import {
    CssBaseline,
    ThemeProvider,
    createTheme,
    useMediaQuery,
} from "@mui/material";

function createAppTheme(mode: "light" | "dark") {
    return createTheme({
        palette: {
            mode,
            primary: {
                main: mode === "dark" ? "#7aa2ff" : "#2457e6",
            },
            secondary: {
                main: mode === "dark" ? "#48d1c6" : "#0f766e",
            },
            background: {
                default: mode === "dark" ? "#0b1220" : "#f5f7fb",
                paper: mode === "dark" ? "#101a2c" : "#ffffff",
            },
        },
        shape: {
            borderRadius: 14,
        },
        typography: {
            fontFamily: "var(--font-geist-sans), Arial, sans-serif",
            h4: {
                fontWeight: 700,
            },
            h5: {
                fontWeight: 700,
            },
            button: {
                textTransform: "none",
                fontWeight: 700,
            },
        },
    });
}

/**
 * Provides the shared MUI theme and global CSS reset for the app.
 */
export function AppProviders({ children }: { children: ReactNode }) {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = useMemo(
        () => createAppTheme(prefersDarkMode ? "dark" : "light"),
        [prefersDarkMode],
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </ThemeProvider>
    );
}
