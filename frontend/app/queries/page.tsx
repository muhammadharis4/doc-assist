"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { HistoryList } from "@/components/queries/HistoryList";
import { QueryComposer } from "@/components/queries/QueryComposer";
import { executeQuery, getQueryHistory } from "@/lib/api/queries";
import { getErrorMessage } from "@/lib/types/api";
import { MAX_QUERY_LENGTH, type QueryHistoryItem } from "@/lib/types/queries";

/**
 * Provides query execution, answer rendering, and recent history.
 */
export default function QueriesPage() {
    const [queryText, setQueryText] = useState("");
    const [history, setHistory] = useState<QueryHistoryItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const refreshHistory = useCallback(async () => {
        setIsLoadingHistory(true);

        try {
            const nextHistory = await getQueryHistory();
            setHistory(nextHistory);
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        void refreshHistory();
    }, [refreshHistory]);

    const runQuery = useCallback(
        async (rawQuery: string) => {
            const trimmedQuery = rawQuery.trim();

            if (!trimmedQuery) {
                setErrorMessage(
                    "Please enter a question before running a query.",
                );
                return;
            }

            if (trimmedQuery.length > MAX_QUERY_LENGTH) {
                setErrorMessage(
                    `Query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
                );
                return;
            }

            if (isSubmitting) {
                return;
            }

            setIsSubmitting(true);
            setErrorMessage("");

            try {
                const result = await executeQuery({ query: trimmedQuery });
                setHistory((current) => [
                    result,
                    ...current.filter((item) => item.id !== result.id),
                ]);
                setQueryText("");
            } catch (error: unknown) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setIsSubmitting(false);
            }
        },
        [isSubmitting],
    );

    const conversation = useMemo(() => [...history].reverse(), [history]);

    const pageSubtitle = useMemo(
        () =>
            isLoadingHistory
                ? "Loading your conversation history..."
                : "Ask questions about your uploaded documents and get grounded answers.",
        [isLoadingHistory],
    );

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Stack spacing={2.5}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="overline"
                            color="primary.main"
                            sx={{ fontWeight: 800 }}
                        >
                            DocAssist
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 0.5 }}>
                            Queries
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            {pageSubtitle}
                        </Typography>
                    </Box>

                    <Button
                        component={Link}
                        href="/"
                        variant="outlined"
                        startIcon={<ArrowBackRoundedIcon />}
                    >
                        Back to documents
                    </Button>
                </Box>

                {errorMessage ? (
                    <Alert severity="error">{errorMessage}</Alert>
                ) : null}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
                        gap: 2,
                        alignItems: "stretch",
                    }}
                >
                    <Box>
                        <HistoryList
                            history={history}
                            onReuseQuery={(query) => {
                                setQueryText(query);
                                void runQuery(query);
                            }}
                        />
                        <Button
                            variant="text"
                            onClick={() => {
                                void refreshHistory();
                            }}
                            sx={{ mt: 1, alignSelf: "flex-start" }}
                        >
                            Refresh history
                        </Button>
                    </Box>

                    <Paper
                        sx={{
                            minHeight: { xs: "70vh", lg: "74vh" },
                            maxHeight: { xs: "78vh", lg: "78vh" },
                            display: "flex",
                            flexDirection: "column",
                            border: "1px solid",
                            borderColor: "divider",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                background:
                                    "linear-gradient(135deg, #f8fbff 0%, #ffffff 65%)",
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700 }}
                            >
                                Query chat
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Conversation-style view using your existing
                                query history.
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2, overflowY: "auto", flex: 1 }}>
                            {conversation.length === 0 && !isSubmitting ? (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        border: "1px dashed",
                                        borderColor: "divider",
                                        p: 3,
                                        textAlign: "center",
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Start your first conversation
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.75 }}
                                    >
                                        Ask about uploaded documents and we will
                                        show answer + source snippets.
                                    </Typography>
                                </Paper>
                            ) : null}

                            {conversation.map((item) => {
                                const itemSources = Array.isArray(item.sources)
                                    ? item.sources
                                    : [];

                                return (
                                    <Stack
                                        key={item.id}
                                        spacing={1.25}
                                        sx={{ mb: 2.5 }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    maxWidth: "85%",
                                                    borderRadius: 3,
                                                    px: 1.75,
                                                    py: 1.25,
                                                    backgroundColor:
                                                        "primary.main",
                                                    color: "primary.contrastText",
                                                    display: "flex",
                                                    gap: 1,
                                                    alignItems: "flex-start",
                                                }}
                                            >
                                                <PersonRoundedIcon fontSize="small" />
                                                <Typography variant="body2">
                                                    {item.query}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "flex-start",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    maxWidth: "92%",
                                                    borderRadius: 3,
                                                    px: 1.75,
                                                    py: 1.25,
                                                    backgroundColor: "grey.100",
                                                    color: "text.primary",
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    display: "flex",
                                                    gap: 1,
                                                    alignItems: "flex-start",
                                                }}
                                            >
                                                <SmartToyRoundedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                                <Stack spacing={1}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            whiteSpace:
                                                                "pre-wrap",
                                                        }}
                                                    >
                                                        {item.answer ??
                                                            "No answer returned."}
                                                    </Typography>

                                                    {itemSources.length > 0 ? (
                                                        <>
                                                            <Divider />
                                                            <Stack spacing={1}>
                                                                {itemSources.map(
                                                                    (
                                                                        source,
                                                                        index,
                                                                    ) => (
                                                                        <Box
                                                                            key={
                                                                                source.id ??
                                                                                `${item.id}-${source.documentId ?? "source"}-${index}`
                                                                            }
                                                                            sx={{
                                                                                border: "1px solid",
                                                                                borderColor:
                                                                                    "divider",
                                                                                borderRadius: 2,
                                                                                p: 1,
                                                                                backgroundColor:
                                                                                    "background.paper",
                                                                            }}
                                                                        >
                                                                            <Stack
                                                                                direction="row"
                                                                                spacing={
                                                                                    1
                                                                                }
                                                                                sx={{
                                                                                    alignItems:
                                                                                        "center",
                                                                                    mb: 0.5,
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        fontWeight: 700,
                                                                                    }}
                                                                                >
                                                                                    {source.documentId ??
                                                                                        "source"}
                                                                                </Typography>
                                                                                {typeof source.score ===
                                                                                "number" ? (
                                                                                    <Chip
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        color="primary"
                                                                                        label={`score ${source.score.toFixed(3)}`}
                                                                                    />
                                                                                ) : null}
                                                                            </Stack>
                                                                            <Typography
                                                                                variant="caption"
                                                                                color="text.secondary"
                                                                                sx={{
                                                                                    whiteSpace:
                                                                                        "pre-wrap",
                                                                                }}
                                                                            >
                                                                                {source.snippet ||
                                                                                    "No snippet available."}
                                                                            </Typography>
                                                                        </Box>
                                                                    ),
                                                                )}
                                                            </Stack>
                                                        </>
                                                    ) : null}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </Stack>
                                );
                            })}

                            {isSubmitting ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            borderRadius: 3,
                                            px: 1.5,
                                            py: 1,
                                            backgroundColor: "grey.100",
                                            border: "1px solid",
                                            borderColor: "divider",
                                            display: "flex",
                                            gap: 1,
                                            alignItems: "center",
                                        }}
                                    >
                                        <SmartToyRoundedIcon
                                            fontSize="small"
                                            color="action"
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Thinking...
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : null}
                        </Box>

                        <Box
                            sx={{
                                p: 2,
                                borderTop: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper",
                            }}
                        >
                            <QueryComposer
                                queryText={queryText}
                                onQueryTextChange={setQueryText}
                                onSubmit={() => {
                                    void runQuery(queryText);
                                }}
                                isSubmitting={isSubmitting}
                                maxLength={MAX_QUERY_LENGTH}
                                embedded
                            />
                        </Box>
                    </Paper>
                </Box>
            </Stack>
        </Container>
    );
}
