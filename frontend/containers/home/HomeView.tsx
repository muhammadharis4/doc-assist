"use client";

import { Box, Container, Stack } from "@mui/material";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LandingDisclaimer } from "@/components/marketing/LandingDisclaimer";
import { LandingHero } from "@/components/marketing/LandingHero";
import { ProblemAndFlowGrid } from "@/components/marketing/ProblemAndFlowGrid";

/**
 * Marketing home: value proposition, problem/flow cards, and legal disclaimer.
 * @returns A transparent `<main>` with hero, two-column content, and footer note (shell from global theme + CSS).
 */
export function HomeView() {
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
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <ThemeSwitcher size="medium" />
                    </Box>
                    <LandingHero />
                    <ProblemAndFlowGrid />
                    <LandingDisclaimer />
                </Stack>
            </Container>
        </Box>
    );
}
