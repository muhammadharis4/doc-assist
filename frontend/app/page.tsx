"use client";

import { Box, Container, Stack } from "@mui/material";
import { LandingDisclaimer } from "@/components/landing/LandingDisclaimer";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemAndFlowGrid } from "@/components/landing/ProblemAndFlowGrid";

/**
 * Marketing home: explain the product, then route to `/documents` or `/chat`.
 * Layout is a vertical stack; shell background is set in `AppProviders` + `globals.css`.
 */
export default function HomePage() {
    return (
        <Box
            component="main"
            sx={{
                minHeight: "100vh",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                background: "transparent",
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    py: { xs: 3, md: 5 },
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 4, md: 6 },
                    minWidth: 0,
                }}
            >
                <Stack
                    spacing={{ xs: 3.5, md: 4.5 }}
                    sx={{ width: 1, minWidth: 0 }}
                >
                    <LandingHero />
                    <ProblemAndFlowGrid />
                    <LandingDisclaimer />
                </Stack>
            </Container>
        </Box>
    );
}
