/**
 * Client-only light/dark preference: React context + localStorage persistence.
 */

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useSyncExternalStore,
    type ReactNode,
} from "react";

const STORAGE_KEY = "docassist-theme-mode";
const DEFAULT_MODE: AppThemeMode = "dark";

export type AppThemeMode = "light" | "dark";

type ThemeModeContextValue = {
    /** Active palette mode passed to `createAppTheme`. */
    mode: AppThemeMode;
    setMode: (mode: AppThemeMode) => void;
    /** Flips between light and dark. */
    toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function readStoredMode(): AppThemeMode {
    if (typeof window === "undefined") {
        return DEFAULT_MODE;
    }
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === "light" || stored === "dark" ? stored : DEFAULT_MODE;
    } catch {
        return DEFAULT_MODE;
    }
}

function subscribeThemeMode(onChange: () => void): () => void {
    if (typeof window === "undefined") {
        return () => {};
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
            onChange();
        }
    };

    const handleLocalToggle = () => onChange();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("docassist-theme-change", handleLocalToggle);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("docassist-theme-change", handleLocalToggle);
    };
}

/**
 * Holds `mode` in state, restores it from `localStorage` after mount, and writes back on change.
 * @param props.children - App tree (typically wrapped by MUI `ThemeProvider` separately).
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
    const mode = useSyncExternalStore(
        subscribeThemeMode,
        readStoredMode,
        () => DEFAULT_MODE,
    );

    const toggleMode = useCallback(() => {
        const nextMode: AppThemeMode = mode === "dark" ? "light" : "dark";
        try {
            window.localStorage.setItem(STORAGE_KEY, nextMode);
        } catch {
            /* ignore */
        }
        window.dispatchEvent(new Event("docassist-theme-change"));
    }, [mode]);

    const setMode = useCallback((nextMode: AppThemeMode) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, nextMode);
        } catch {
            /* ignore */
        }
        window.dispatchEvent(new Event("docassist-theme-change"));
    }, []);

    const value = useMemo(
        () => ({
            mode,
            setMode,
            toggleMode,
        }),
        [mode, setMode, toggleMode],
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
