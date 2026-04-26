/**
 * Global MUI `ThemeProvider` + `CssBaseline`. Dark body background matches
 * the landing page gradient in `createAppTheme` (see `MuiCssBaseline` overrides).
 */
"use client";

import { useMemo, type ReactNode } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

/** One base tone with the landing gradient; avoids #000 “footer” strips vs <main>. */
const darkShell = "#050508";
const appBodyBackground = {
    backgroundColor: darkShell,
    backgroundImage: [
        "radial-gradient(1200px 500px at 50% -10%, rgba(122, 162, 255, 0.12), transparent 55%)",
        "linear-gradient(180deg, #0a0b10 0%, #050508 45%, #050508 100%)",
    ].join(", "),
    backgroundAttachment: "fixed",
} as const;

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
                default: mode === "dark" ? darkShell : "#f5f7fb",
                paper: mode === "dark" ? darkShell : "#ffffff",
            },
        },
        shape: {
            borderRadius: 8,
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
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body:
                        mode === "dark"
                            ? { ...appBodyBackground }
                            : { backgroundColor: "#f5f7fb" },
                },
            },
        },
    });
}

/**
 * Provides the shared MUI theme and global CSS reset for the app.
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
