"use client";

import { CircularProgress, Paper, Stack, Typography } from "@mui/material";

interface AnswerPanelProps {
    answer: string | null;
    isLoading: boolean;
}

/**
 * Renders the latest answer state for the active query.
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
