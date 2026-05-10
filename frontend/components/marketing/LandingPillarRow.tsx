"use client";

import { Stack } from "@mui/material";
import { PILLAR_ITEMS } from "./pillarData";
import { PillarCard } from "./PillarCard";

/**
 * Responsive row of three value props (files, language, verified sources).
 * @returns A `Stack` of `PillarCard` from `PILLAR_ITEMS`.
 */
export function LandingPillarRow() {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 3, maxWidth: 800, mx: "auto" }}
        >
            {PILLAR_ITEMS.map((item) => (
                <PillarCard
                    key={item.label}
                    label={item.label}
                    sub={item.sub}
                    icon={item.icon}
                />
            ))}
        </Stack>
    );
}
