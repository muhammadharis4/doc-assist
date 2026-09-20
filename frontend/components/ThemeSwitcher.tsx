"use client";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

type ThemeSwitcherProps = {
    /** MUI `IconButton` size; default `small` for dense toolbars. */
    size?: "small" | "medium" | "large";
};

/**
 * Toggles light/dark mode through MUI's `useColorScheme` (persists in `localStorage`).
 * @param props - Optional `size` for the control.
 */
export function ThemeSwitcher({ size = "small" }: ThemeSwitcherProps) {
    const { mode, setMode } = useColorScheme();
    const isDark = mode !== "light";

    return (
        <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
            <IconButton
                size={size}
                onClick={() => setMode(isDark ? "light" : "dark")}
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
