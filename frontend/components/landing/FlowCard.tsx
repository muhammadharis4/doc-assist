"use client";

import { Stack } from "@mui/material";
import { flowSteps } from "./copy";
import { FlowStepItem } from "./FlowStepItem";
import { LandingSectionCard } from "./LandingSectionCard";

/**
 * Right column: upload → ask → verify steps.
 * @returns A `LandingSectionCard` with one `FlowStepItem` per `flowSteps` entry.
 */
export function FlowCard() {
    return (
        <LandingSectionCard
            kicker="The flow"
            title="Upload, ask, verify"
        >
            <Stack spacing={1.5} sx={{ mt: 1.25 }}>
                {flowSteps.map((step) => (
                    <FlowStepItem
                        key={step.n}
                        n={step.n}
                        title={step.title}
                        body={step.body}
                    />
                ))}
            </Stack>
        </LandingSectionCard>
    );
}
