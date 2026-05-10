"use client";

import { Box } from "@mui/material";
import { HeroCtas } from "./HeroCtas";
import { HeroMessage } from "./HeroMessage";
import { LandingPillarRow } from "./LandingPillarRow";

const HEADLINE = "Understand documents faster";
const LEDE =
    "Upload your files, ask in German or English, get answers with short source quotes you can check—ideal for life in Germany.";

/**
 * Full-width hero: message, document/chat CTAs, then three pillars.
 * @returns A centered `Box` combining `HeroMessage`, `HeroCtas`, and `LandingPillarRow`.
 */
export function LandingHero() {
    return (
        <Box sx={{ textAlign: "center" }}>
            <HeroMessage
                brand="DocAssist"
                headline={HEADLINE}
                lede={LEDE}
            />
            <HeroCtas
                documentsHref="/documents"
                chatHref="/chat"
                primaryLabel="Add documents"
                secondaryLabel="Start chatting"
            />
            <LandingPillarRow />
        </Box>
    );
}
