"use client";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";
import { useThemeMode } from "@/hooks/theme-mode";

type ThemeSwitcherProps = {
    /** MUI `IconButton` size; default `small` for dense toolbars. */
    size?: "small" | "medium" | "large";
};

/**
 * Toggles stored light/dark mode via `useThemeMode` (persists in `localStorage`).
 * @param props - Optional `size` for the control.
 */
export function ThemeSwitcher({ size = "small" }: ThemeSwitcherProps) {
    const { mode, toggleMode } = useThemeMode();
    const isDark = mode === "dark";

    return (
        <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
            <IconButton
                size={size}
                onClick={() => toggleMode()}
                aria-label={
                    isDark ? "Switch to light theme" : "Switch to dark theme"
                }
                color="inherit"
            >
                {isDark ? (
                    <LightModeRoundedIcon fontSize={size === "small" ? "small" : "medium"} />
                ) : (
                    <DarkModeRoundedIcon fontSize={size === "small" ? "small" : "medium"} />
                )}
            </IconButton>
        </Tooltip>
    );
}
