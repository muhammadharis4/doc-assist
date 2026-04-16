"use client";

import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import type { QuerySource } from "@/lib/types/queries";

interface SourcesListProps {
    sources: QuerySource[];
}

/**
 * Displays source snippets that contributed to the latest answer.
 */
export function SourcesList({ sources }: SourcesListProps) {
    return (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
                <Typography variant="h6">Sources</Typography>

                {sources.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No source chunks available for this answer.
                    </Typography>
                ) : (
                    sources.map((source, index) => (
                        <Stack
                            key={
                                source.id ??
                                `${source.documentId ?? "source"}-${index}`
                            }
                            spacing={1}
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 1.5,
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                            >
                                <ArticleRoundedIcon
                                    fontSize="small"
                                    color="action"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700 }}
                                >
                                    {source.documentId ?? `source-${index + 1}`}
                                </Typography>
                                {typeof source.score === "number" ? (
                                    <Chip
                                        size="small"
                                        label={`score ${source.score.toFixed(3)}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ) : null}
                            </Stack>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ whiteSpace: "pre-wrap" }}
                            >
                                {source.snippet || "No snippet available."}
                            </Typography>
                        </Stack>
                    ))
                )}
            </Stack>
        </Paper>
    );
}
