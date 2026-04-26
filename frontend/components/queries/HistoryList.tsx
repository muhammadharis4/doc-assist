"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import {
    Box,
    Button,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import type { QueryHistoryItem } from "@/lib/types/queries";

interface HistoryListProps {
    history: QueryHistoryItem[];
    onReuseQuery: (query: string) => void;
    onDeleteHistory: (id: string) => void;
    deletingHistoryId: string | null;
    isLoading: boolean;
}

/**
 * Renders recent chat history with rerun and delete actions.
 */
export function HistoryList({
    history,
    onReuseQuery,
    onDeleteHistory,
    deletingHistoryId,
    isLoading,
}: HistoryListProps) {
    return (
        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
                <Box>
                    <Typography variant="h6">Chat history</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Reopen a previous question or remove it from your list.
                    </Typography>
                </Box>

                {isLoading ? (
                    <Stack spacing={1.25}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Paper
                                key={index}
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2 }}
                            >
                                <Skeleton width="72%" />
                                <Skeleton width="40%" />
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <Skeleton width={84} height={32} />
                                    <Skeleton width={36} height={32} />
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                ) : history.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No chat history yet. Your latest questions will appear
                        here.
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
                            <Stack direction="row" spacing={0.5}>
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<ReplayRoundedIcon />}
                                    onClick={() => onReuseQuery(item.query)}
                                >
                                    Run again
                                </Button>
                                <IconButton
                                    aria-label={`Delete chat ${item.query}`}
                                    onClick={() => onDeleteHistory(item.id)}
                                    disabled={deletingHistoryId === item.id}
                                    color="error"
                                    size="small"
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </Stack>
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
