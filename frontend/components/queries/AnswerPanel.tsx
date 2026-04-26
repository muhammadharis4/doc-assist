"use client";

import { CircularProgress, Paper, Stack, Typography } from "@mui/material";

interface AnswerPanelProps {
    /** Assistant answer text, or `null` if none. */
    answer: string | null;
    /** Shows a progress state instead of the answer body. */
    isLoading: boolean;
}

/**
 * Static answer area with optional loading and empty copy.
 * @param props - See `AnswerPanelProps`.
 * @returns A bordered `Paper` with the answer or placeholder text.
 */
export function AnswerPanel({ answer, isLoading }: AnswerPanelProps) {
    return (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
                <Typography variant="h6">Answer</Typography>

                {isLoading ? (
                    <Stack
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: "center" }}
                    >
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                            Thinking through your question...
                        </Typography>
                    </Stack>
                ) : answer ? (
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {answer}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Ask a question to get an answer grounded in your
                        uploaded documents.
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
}
