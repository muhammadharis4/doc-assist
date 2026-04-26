"use client";

import { Box, Typography } from "@mui/material";
import { legalDisclaimer } from "./copy";

/**
 * Muted full-width note below the grid; not a legal substitute for a professional.
 * Rendered as `footer` for landmarks / screen readers.
 */
export function LandingDisclaimer() {
    return (
        <Box
            component="footer"
            role="contentinfo"
            aria-label="Disclaimer"
            sx={{
                width: "100%",
                pt: { xs: 2.5, sm: 3.5 },
                pb: { xs: 0.5, sm: 1 },
                mt: { xs: 0.5, sm: 1 },
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
        >
            <Typography
                variant="body2"
                component="p"
                sx={{
                    m: 0,
                    textAlign: "center",
                    lineHeight: 1.7,
                    maxWidth: "min(32rem, 100%)",
                    mx: "auto",
                    px: { xs: 0.5, sm: 0 },
                    color: "rgba(195, 204, 220, 0.92)",
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    overflowWrap: "anywhere",
                }}
            >
                {legalDisclaimer}
            </Typography>
        </Box>
    );
}
