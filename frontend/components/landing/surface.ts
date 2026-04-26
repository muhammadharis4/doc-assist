/**
 * Shared MUI `sx` for glassy, low-contrast cards on the dark shell background.
 * Keeps problem/flow/hero tiles visually aligned.
 */

import type { SxProps, Theme } from "@mui/material";

export const surfaceCardSx: SxProps<Theme> = {
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(8px)",
    boxShadow: "none",
};
