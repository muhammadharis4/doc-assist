"use client";

import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { Button, Paper, Stack, Typography } from "@mui/material";
import type { QueryHistoryItem } from "@/lib/types/queries";

interface HistoryListProps {
    history: QueryHistoryItem[];
    onReuseQuery: (query: string) => void;
}

/**
 * Renders recent query history with rerun actions.
 */
export function HistoryList({ history, onReuseQuery }: HistoryListProps) {
    return (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
                <Typography variant="h6">Recent history</Typography>

                {history.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No queries yet. Your latest runs will appear here.
                    </Typography>
                ) : (
                    history.map((item) => (
                        <Stack
                            key={item.id}
                            spacing={0.75}
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 1.5,
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 700 }}
                            >
                                {item.query}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {formatTimestamp(item.createdAt)}
                            </Typography>
                            <Button
                                size="small"
                                variant="text"
                                startIcon={<ReplayRoundedIcon />}
                                onClick={() => onReuseQuery(item.query)}
                                sx={{ alignSelf: "flex-start", mt: 0.5 }}
                            >
                                Run again
                            </Button>
                        </Stack>
                    ))
                )}
            </Stack>
        </Paper>
    );
}

function formatTimestamp(value: string): string {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
