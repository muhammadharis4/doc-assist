"use client";

import { Box, Typography } from "@mui/material";

const ACCENT =
    "linear-gradient(90deg, transparent, rgba(122, 162, 255, 0.8), transparent)";

type HeroMessageProps = {
    brand: string;
    headline: string;
    lede: string;
};

/**
 * Top-of-hero: product name, accent bar, H1, and short supporting line.
 */
export function HeroMessage({ brand, headline, lede }: HeroMessageProps) {
    return (
        <>
            <Typography
                variant="overline"
                sx={{
                    letterSpacing: "0.2em",
                    color: "rgba(200, 210, 230, 0.65)",
                    fontWeight: 600,
                }}
            >
                {brand}
            </Typography>

            <Box
                sx={{ maxWidth: 720, mx: "auto", mt: 2.5, mb: 1 }}
            >
                <Box
                    sx={{
                        display: "inline-block",
                        width: 48,
                        height: 3,
                        borderRadius: 1,
                        background: ACCENT,
                        mb: 3,
                    }}
                />
                <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        fontSize: {
                            xs: "1.75rem",
                            sm: "2.25rem",
                            md: "2.75rem",
                        },
                        color: "#f0f2f7",
                    }}
                >
                    {headline}
                </Typography>
            </Box>

            <Typography
                sx={{
                    maxWidth: 480,
                    mx: "auto",
                    color: "rgba(200, 208, 224, 0.88)",
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                }}
            >
                {lede}
            </Typography>
        </>
    );
}
