/**
 * Client-only light/dark preference: React context + localStorage persistence.
 */

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

const STORAGE_KEY = "docassist-theme-mode";

export type AppThemeMode = "light" | "dark";

type ThemeModeContextValue = {
    /** Active palette mode passed to `createAppTheme`. */
    mode: AppThemeMode;
    setMode: (mode: AppThemeMode) => void;
    /** Flips between light and dark. */
    toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/**
 * Holds `mode` in state, restores it from `localStorage` after mount, and writes back on change.
 * @param props.children - App tree (typically wrapped by MUI `ThemeProvider` separately).
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<AppThemeMode>(() => {
        if (typeof window === "undefined") {
            return "dark";
        }
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            return stored === "light" || stored === "dark" ? stored : "dark";
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            /* ignore */
        }
    }, [mode]);

    const toggleMode = useCallback(() => {
        setMode((current) => (current === "dark" ? "light" : "dark"));
    }, []);

    const value = useMemo(
        () => ({
            mode,
            setMode,
            toggleMode,
        }),
        [mode, toggleMode],
    );

    return (
        <ThemeModeContext.Provider value={value}>
            {children}
        </ThemeModeContext.Provider>
    );
}

/**
 * @returns Current theme mode API from `ThemeModeProvider`.
 * @throws When used outside `ThemeModeProvider`.
 */
export function useThemeMode(): ThemeModeContextValue {
    const context = useContext(ThemeModeContext);
    if (!context) {
        throw new Error("useThemeMode must be used within ThemeModeProvider.");
    }
    return context;
}
