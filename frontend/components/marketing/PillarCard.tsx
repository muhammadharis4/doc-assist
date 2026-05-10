"use client";

import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getSurfaceCardSx } from "./surface";

type PillarCardProps = {
    /** Primary line (bold). */
    label: string;
    /** Secondary caption. */
    sub: string;
    /** Left icon (typically MUI icon). */
    icon: ReactNode;
};

/**
 * Single feature tile in the hero pillar row.
 * @param props - `PillarCardProps`.
 * @returns A `Paper` with icon chip and two text lines.
 */
export function PillarCard({ label, sub, icon }: PillarCardProps) {
    return (
        <Paper
            elevation={0}
            sx={(theme) => ({
                flex: 1,
                minWidth: 0,
                py: 1.5,
                px: 1.5,
                textAlign: "left",
                borderRadius: 2,
                ...getSurfaceCardSx(theme),
            })}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <Box
                    sx={(theme) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                    })}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "text.secondary",
                            display: "block",
                            lineHeight: 1.4,
                        }}
                    >
                        {sub}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}
