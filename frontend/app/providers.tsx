"use client";

import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#2563eb",
        },
        secondary: {
            main: "#0f766e",
        },
        background: {
            default: "#f5f7fb",
            paper: "#ffffff",
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

/**
 * Provides the shared MUI theme and global CSS reset for the app.
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
