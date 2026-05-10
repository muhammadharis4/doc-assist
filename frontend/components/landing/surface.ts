/**
 * Shared MUI `sx` for marketing cards: glass stack on dark, solid paper on light.
 */

import type { Theme } from "@mui/material";

/**
 * @param theme - Active MUI theme from an `sx` callback.
 * @returns Fill, border, and shadow appropriate for the current mode.
 */
export function getSurfaceCardSx(theme: Theme) {
    if (theme.palette.mode === "dark") {
        return {
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(8px)",
            boxShadow: "none" as const,
        };
    }
    return {
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
        backdropFilter: "none" as const,
    };
}
