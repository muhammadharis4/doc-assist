"use client";

import { Typography } from "@mui/material";
import { problemBlurb } from "./copy";
import { DocumentExampleList } from "./DocumentExampleList";
import { LandingSectionCard } from "./LandingSectionCard";

/**
 * Left column: paperwork pain point + example document types.
 * @returns A `LandingSectionCard` with `DocumentExampleList` and the problem blurb.
 */
export function ProblemCard() {
    return (
        <LandingSectionCard
            kicker="The problem"
            title="When paperwork piles up"
            underTitle={<DocumentExampleList />}
        >
            <Typography
                variant="body2"
                sx={{
                    color: "text.secondary",
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                    mt: 2,
                }}
            >
                {problemBlurb}
            </Typography>
        </LandingSectionCard>
    );
}
