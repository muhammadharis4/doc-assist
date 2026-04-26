"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, Box, Container, Paper, Stack, Typography } from "@mui/material";
import { HistoryList } from "@/components/queries/HistoryList";
import { QueryComposer } from "@/components/queries/QueryComposer";
import {
    deleteQueryHistory,
    getQueryHistory,
    streamQuery,
} from "@/lib/api/queries";
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
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(
        null,
    );
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [streamingQuery, setStreamingQuery] = useState("");
    const [streamingAnswer, setStreamingAnswer] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const refreshHistory = useCallback(async () => {
        setIsLoadingHistory(true);

        try {
            const nextHistory = await getQueryHistory();
            setHistory(nextHistory);
            setErrorMessage("");
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
            setStreamingQuery(trimmedQuery);
            setStreamingAnswer("");
            setQueryText("");

            try {
                await streamQuery(
                    { query: trimmedQuery },
                    {
                        onToken: (delta) => {
                            setStreamingAnswer((current) => current + delta);
                        },
                        onDone: (result) => {
                            setHistory((current) => [
                                result,
                                ...current.filter(
                                    (item) => item.id !== result.id,
                                ),
                            ]);
                        },
                    },
                );
            } catch (error: unknown) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setIsSubmitting(false);
                setStreamingQuery("");
                setStreamingAnswer("");
            }
        },
        [isSubmitting],
    );

    const conversation = useMemo(() => [...history].reverse(), [history]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, streamingQuery, streamingAnswer]);

    const handleDeleteHistory = useCallback(
        async (id: string) => {
            const snapshot = history.find((item) => item.id === id);
            if (!snapshot) {
                return;
            }

            setDeletingHistoryId(id);
            setErrorMessage("");
            setHistory((current) => current.filter((item) => item.id !== id));

            try {
                await deleteQueryHistory(id);
            } catch (error: unknown) {
                setHistory((current) => [snapshot, ...current]);
                setErrorMessage(getErrorMessage(error));
            } finally {
                setDeletingHistoryId(null);
            }
        },
        [history],
    );

    const startNewChat = useCallback(() => {
        setQueryText("");
        setErrorMessage("");
        setStreamingQuery("");
        setStreamingAnswer("");
        setIsHistoryCollapsed(false);
    }, []);

    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{ px: { xs: 1, md: 2 }, py: 1.5, minHeight: "100vh" }}
        >
            <Stack spacing={1.5} sx={{ minHeight: "100vh" }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="overline"
                            color="primary.main"
                            sx={{ fontWeight: 800 }}
                        >
                            DocAssist
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 0.5 }}>
                            Chat
                        </Typography>
                    </Box>
                </Box>

                {errorMessage ? (
                    <Alert severity="error">{errorMessage}</Alert>
                ) : null}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: isHistoryCollapsed ? "56px 1fr" : "300px 1fr",
                        },
                        gap: 2,
                        alignItems: "stretch",
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    <HistoryList
                        history={history}
                        isLoading={isLoadingHistory}
                        isCollapsed={isHistoryCollapsed}
                        onToggleCollapsed={() => {
                            setIsHistoryCollapsed((current) => !current);
                        }}
                        onNewChat={startNewChat}
                        onOpenDocuments={() => {
                            window.location.href = "/";
                        }}
                        onReuseQuery={(query) => {
                            setQueryText(query);
                            void runQuery(query);
                        }}
                        onDeleteHistory={handleDeleteHistory}
                        deletingHistoryId={deletingHistoryId}
                    />

                    <Paper
                        sx={{
                            minHeight: 0,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            border: "1px solid",
                            borderColor: "divider",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                p: 1.5,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper",
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700 }}
                            >
                                Conversation
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                p: 1.5,
                                overflowY: "auto",
                                flex: 1,
                                scrollPaddingTop: 8,
                            }}
                        >
                            {conversation.map((item) => (
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
                                                backgroundColor: "primary.main",
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
                                            <Typography
                                                variant="body2"
                                                sx={{ whiteSpace: "pre-wrap" }}
                                            >
                                                {item.answer ??
                                                    "No answer returned."}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            ))}

                            {streamingQuery ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        mb: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: "85%",
                                            borderRadius: 3,
                                            px: 1.75,
                                            py: 1.25,
                                            backgroundColor: "primary.main",
                                            color: "primary.contrastText",
                                            display: "flex",
                                            gap: 1,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <PersonRoundedIcon fontSize="small" />
                                        <Typography variant="body2">
                                            {streamingQuery}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : null}

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
                                            {streamingAnswer ||
                                                "Thinking through your question..."}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : null}

                            <Box ref={messagesEndRef} />
                        </Box>

                        <Box
                            sx={{
                                p: 1.5,
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
