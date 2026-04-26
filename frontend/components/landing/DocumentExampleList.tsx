"use client";

import { Box, Typography } from "@mui/material";
import { exampleDocuments } from "./copy";

type LineProps = (typeof exampleDocuments)[number];

function ExampleLine({ emoji, text }: LineProps) {
    return (
        <Box
            component="li"
            sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
                py: 0.4,
            }}
        >
            <Box
                component="span"
                aria-hidden
                sx={{
                    flexShrink: 0,
                    width: 24,
                    textAlign: "center",
                    lineHeight: 1.5,
                }}
            >
                {emoji}
            </Box>
            <Typography
                component="span"
                variant="body2"
                sx={{
                    color: "rgba(200, 208, 224, 0.92)",
                    lineHeight: 1.55,
                }}
            >
                {text}
            </Typography>
        </Box>
    );
}

/**
 * Unstyled list of example German-life document types (emoji + label).
 */
export function DocumentExampleList() {
    return (
        <Box
            component="ul"
            sx={{
                m: 0,
                mt: 1.5,
                mb: 0,
                p: 0,
                pl: 0,
                listStyle: "none",
            }}
        >
            {exampleDocuments.map((row) => (
                <ExampleLine key={row.text} {...row} />
            ))}
        </Box>
    );
}
