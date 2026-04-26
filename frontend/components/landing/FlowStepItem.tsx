"use client";

import { Box, Typography } from "@mui/material";

type FlowStepItemProps = {
    /** Step index (1-based), shown in the badge. */
    n: number;
    /** Short step title. */
    title: string;
    /** Supporting sentence. */
    body: string;
};

/**
 * One numbered step with a badge (right-hand “The flow” card).
 * @param props - `FlowStepItemProps`.
 * @returns A horizontal flex row: badge + title/body column.
 */
export function FlowStepItem({ n, title, body }: FlowStepItemProps) {
    return (
        <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box
                sx={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    backgroundColor: "rgba(122, 162, 255, 0.15)",
                    color: "primary.light",
                }}
            >
                {n}
            </Box>
            <Box>
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#e8ecf5", mb: 0.5 }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "rgba(200, 208, 224, 0.88)",
                        lineHeight: 1.55,
                        overflowWrap: "anywhere",
                    }}
                >
                    {body}
                </Typography>
            </Box>
        </Box>
    );
}
