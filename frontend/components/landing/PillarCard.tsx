"use client";

import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { surfaceCardSx } from "./surface";

type PillarCardProps = {
    label: string;
    sub: string;
    icon: ReactNode;
};

/**
 * Single feature tile in the hero pillar row.
 */
export function PillarCard({ label, sub, icon }: PillarCardProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                flex: 1,
                minWidth: 0,
                py: 1.5,
                px: 1.5,
                textAlign: "left",
                borderRadius: 2,
                ...surfaceCardSx,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(122, 162, 255, 0.12)",
                        color: "primary.light",
                    }}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "#e8ecf5" }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(180, 190, 210, 0.85)",
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
