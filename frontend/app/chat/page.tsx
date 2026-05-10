"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import {
    Alert,
    Box,
    Container,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { NavHomeButton } from "@/components/NavHomeButton";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { HistoryList } from "@/components/queries/HistoryList";
import { QueryComposer } from "@/components/queries/QueryComposer";
import {
    deleteQueryHistory,
    getQueryHistory,
    streamQuery,
} from "@/lib/api/queries";
import { getAssistantMessageTokens, getChatShellTokens } from "@/lib/theme";
import { getErrorMessage } from "@/lib/types/api";
import { MAX_QUERY_LENGTH, type QueryHistoryItem } from "@/lib/types/queries";

/**
 * Chat UI: sidebar history, streaming Q&A, composer, and links to documents / home.
 * @returns Full client page with `HistoryList`, conversation area, and `QueryComposer`.
 */
export default function ChatPage() {
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
            sx={(theme) => ({
                px: { xs: 1, md: 1.5 },
                pt: { xs: 1.25, md: 1.5 },
                pb: 1.25,
                minHeight: "100vh",
                boxSizing: "border-box",
                backgroundColor: getChatShellTokens(theme).pageBg,
            })}
        >
            <Stack spacing={1} sx={{ minHeight: "calc(100vh - 32px)" }}>
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
                        gap: 1,
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
                            window.location.href = "/documents";
                        }}
                        onReuseQuery={(query) => {
                            setQueryText(query);
                            void runQuery(query);
                        }}
                        onDeleteHistory={handleDeleteHistory}
                        deletingHistoryId={deletingHistoryId}
                    />

                    <Paper
                        sx={(theme) => {
                            const c = getChatShellTokens(theme);
                            return {
                                minHeight: 0,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                border: "1px solid",
                                borderColor: c.subtleBorder,
                                backgroundColor: c.mainChromeBg,
                                overflow: "hidden",
                                borderRadius: 1.5,
                            };
                        }}
                    >
                        <Box
                            sx={(theme) => {
                                const c = getChatShellTokens(theme);
                                return {
                                    p: 1,
                                    borderBottom: "1px solid",
                                    borderColor: c.subtleBorder,
                                    backgroundColor: c.mainChromeBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 1,
                                };
                            }}
                        >
                            <Box
                                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                                <ChatRoundedIcon
                                    fontSize="small"
                                    color="primary"
                                />
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 700 }}
                                >
                                    Conversation
                                </Typography>
                            </Box>
                            <Box
                                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                            >
                                <NavHomeButton size="small" />
                                <Tooltip title="New chat">
                                    <IconButton
                                        size="small"
                                        onClick={startNewChat}
                                        aria-label="New chat"
                                    >
                                        <EditNoteRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Open documents">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            window.location.href = "/documents";
                                        }}
                                        aria-label="Open documents"
                                    >
                                        <DescriptionRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <ThemeSwitcher size="small" />
                            </Box>
                        </Box>

                        <Box
                            sx={(theme) => ({
                                p: 1.25,
                                overflowY: "auto",
                                flex: 1,
                                scrollPaddingTop: 8,
                                backgroundColor: getChatShellTokens(theme)
                                    .mainChromeBg,
                            })}
                        >
                            {conversation.length === 0 && !streamingQuery && !isSubmitting ? (
                                <Box
                                    sx={{
                                        minHeight: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        px: 2,
                                    }}
                                >
                                    <Stack
                                        spacing={0.75}
                                        sx={{ textAlign: "center", maxWidth: 420 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Start a new conversation
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Ask a question about your uploaded
                                            documents to see grounded answers and
                                            source snippets.
                                        </Typography>
                                    </Stack>
                                </Box>
                            ) : null}

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
                                            sx={(theme) => {
                                                const a =
                                                    getAssistantMessageTokens(
                                                        theme,
                                                    );
                                                return {
                                                    maxWidth: "92%",
                                                    borderRadius: 3,
                                                    px: 1.75,
                                                    py: 1.25,
                                                    backgroundColor: a.surface,
                                                    color: a.onSurface,
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    display: "flex",
                                                    gap: 1,
                                                    alignItems: "flex-start",
                                                };
                                            }}
                                        >
                                            <SmartToyRoundedIcon
                                                fontSize="small"
                                                sx={(theme) => ({
                                                    color: getAssistantMessageTokens(
                                                        theme,
                                                    ).onSurfaceIcon,
                                                })}
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
                                        sx={(theme) => {
                                            const a = getAssistantMessageTokens(
                                                theme,
                                            );
                                            return {
                                                borderRadius: 3,
                                                px: 1.5,
                                                py: 1,
                                                backgroundColor: a.surface,
                                                color: a.onSurface,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                display: "flex",
                                                gap: 1,
                                                alignItems: "center",
                                            };
                                        }}
                                    >
                                        <SmartToyRoundedIcon
                                            fontSize="small"
                                            sx={(theme) => ({
                                                color: getAssistantMessageTokens(
                                                    theme,
                                                ).onSurfaceIcon,
                                            })}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={(theme) => ({
                                                color: getAssistantMessageTokens(
                                                    theme,
                                                ).onSurfaceMuted,
                                            })}
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
                            sx={(theme) => {
                                const c = getChatShellTokens(theme);
                                return {
                                    p: 1,
                                    borderTop: "1px solid",
                                    borderColor: c.subtleBorder,
                                    backgroundColor: c.mainChromeBg,
                                };
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
