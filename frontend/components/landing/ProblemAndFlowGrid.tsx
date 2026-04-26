"use client";

import { Grid } from "@mui/material";
import { FlowCard } from "./FlowCard";
import { ProblemCard } from "./ProblemCard";

/**
 * Two-up layout: problem + flow cards (stacks on small screens).
 */
export function ProblemAndFlowGrid() {
    return (
        <Grid
            container
            spacing={2}
            sx={{ alignItems: "stretch" }}
        >
            <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
                <ProblemCard />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
                <FlowCard />
            </Grid>
        </Grid>
    );
}
