"use client";

import type { ReactNode } from "react";
import { Paper, Typography } from "@mui/material";
import { getSurfaceCardSx } from "./surface";

export type LandingSectionCardProps = {
    /** Small uppercase label above the title. */
    kicker: string;
    /** Main heading. */
    title: string;
    /** Optional block between title and children (e.g. lists). */
    underTitle?: ReactNode;
    /** Main body (typically paragraphs or stacks). */
    children: ReactNode;
};

/**
 * Rounded, glassy `Paper` with kicker, title, and slots for body content.
 * @param props - `LandingSectionCardProps`.
 * @returns MUI `Paper` applying `surfaceCardSx`.
 */
export function LandingSectionCard({
    kicker,
    title,
    underTitle,
    children,
}: LandingSectionCardProps) {
    return (
        <Paper
            elevation={0}
            sx={(theme) => ({
                p: { xs: 2, sm: 2.25 },
                height: "100%",
                minWidth: 0,
                borderRadius: 2,
                ...getSurfaceCardSx(theme),
            })}
        >
            <Typography
                variant="overline"
                sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                }}
            >
                {kicker}
            </Typography>
            <Typography
                variant="h6"
                component="h2"
                sx={{
                    fontWeight: 800,
                    mt: 0.5,
                    mb: 0,
                    color: "text.primary",
                }}
            >
                {title}
            </Typography>
            {underTitle}
            {children}
        </Paper>
    );
}
