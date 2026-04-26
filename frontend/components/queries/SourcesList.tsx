"use client";

import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import { Paper, Stack, Typography } from "@mui/material";
import type { QuerySource } from "@/lib/types/queries";

interface SourcesListProps {
    /** RAG source chunks (document + excerpt) for the current answer. */
    sources: QuerySource[];
}

/**
 * Lists each source chunk in a small card (title, snippet, metadata if present).
 * @param props - See `SourcesListProps`.
 * @returns A `Paper` with a per-source `Stack`, or a “no sources” line.
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
