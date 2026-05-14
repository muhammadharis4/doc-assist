"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { NavHomeButton } from "@/components/NavHomeButton";
import { QueryComposer } from "@/components/queries/QueryComposer";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
    deleteQueryHistory,
    getQueryHistory,
    streamQuery,
} from "@/services/queries";
import { getAssistantMessageTokens, getChatShellTokens } from "@/libs/theme";
import { getErrorMessage } from "@/types/api";
import { MAX_QUERY_LENGTH, type QueryHistoryItem } from "@/types/queries";

const LS_RAG = "docassist.chat.ragEnabled";
const LS_TOPK = "docassist.chat.topK";
const LS_TEMP = "docassist.chat.temperature";

/**
 * Chat UI: Jam-style sidebar (nav + RAG + history), main transcript, and pill composer.
 * @returns Full client page with `ChatSidebar`, conversation area, and `QueryComposer`.
 */
export function ChatView() {
    const theme = useTheme();
    const [queryText, setQueryText] = useState("");
    const [history, setHistory] = useState<QueryHistoryItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [streamingQuery, setStreamingQuery] = useState("");
    const [streamingAnswer, setStreamingAnswer] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [settingsHydrated, setSettingsHydrated] = useState(false);
    const [ragEnabled, setRagEnabled] = useState(true);
    const [topK, setTopK] = useState(5);
    const [temperature, setTemperature] = useState(0.7);

    useEffect(() => {
        queueMicrotask(() => {
            try {
                const r = localStorage.getItem(LS_RAG);
                if (r !== null) {
                    setRagEnabled(r === "true");
                }
                const k = localStorage.getItem(LS_TOPK);
                if (k !== null) {
                    const n = Number.parseInt(k, 10);
                    if (!Number.isNaN(n)) {
                        setTopK(Math.min(20, Math.max(1, n)));
                    }
                }
                const t = localStorage.getItem(LS_TEMP);
                if (t !== null) {
                    const f = Number.parseFloat(t);
                    if (!Number.isNaN(f)) {
                        setTemperature(Math.min(1, Math.max(0, f)));
                    }
                }
            } catch {
                /* ignore */
            } finally {
                setSettingsHydrated(true);
            }
        });
    }, []);

    useEffect(() => {
        if (!settingsHydrated) {
            return;
        }
        try {
            localStorage.setItem(LS_RAG, String(ragEnabled));
            localStorage.setItem(LS_TOPK, String(topK));
            localStorage.setItem(LS_TEMP, String(temperature));
        } catch {
            /* ignore */
        }
    }, [settingsHydrated, ragEnabled, topK, temperature]);

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
        queueMicrotask(() => {
            void refreshHistory();
        });
    }, [refreshHistory]);

    const runQuery = useCallback(
        async (rawQuery: string) => {
            const trimmedQuery = rawQuery.trim();

            if (!trimmedQuery) {
                setErrorMessage("Please enter a question before running a query.");
                return;
            }

            if (trimmedQuery.length > MAX_QUERY_LENGTH) {
                setErrorMessage(`Query must be ${MAX_QUERY_LENGTH} characters or fewer.`);
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
                    {
                        query: trimmedQuery,
                        ragEnabled,
                        topK,
                        temperature,
                    },
                    {
                        onToken: (delta) => {
                            setStreamingAnswer((current) => current + delta);
                        },
                        onDone: (result) => {
                            setHistory((current) => [
                                result,
                                ...current.filter((item) => item.id !== result.id),
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
        [isSubmitting, ragEnabled, topK, temperature],
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
    }, []);

    const shell = getChatShellTokens(theme);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                width: "100%",
                minHeight: "100vh",
                boxSizing: "border-box",
                backgroundColor: shell.pageBg,
            }}
        >
            <Box
                sx={{
                    width: { xs: "100%", md: 300 },
                    flexShrink: 0,
                    maxHeight: { xs: 400, md: "none" },
                    minHeight: { md: "100vh" },
                    overflow: { xs: "auto", md: "hidden" },
                    borderRight: { md: `1px solid ${shell.subtleBorder}` },
                }}
            >
                <ChatSidebar
                    history={history}
                    isLoadingHistory={isLoadingHistory}
                    deletingHistoryId={deletingHistoryId}
                    onReuseQuery={(query) => {
                        setQueryText(query);
                        void runQuery(query);
                    }}
                    onDeleteHistory={handleDeleteHistory}
                    ragEnabled={ragEnabled}
                    onRagEnabledChange={setRagEnabled}
                    topK={topK}
                    onTopKChange={setTopK}
                    temperature={temperature}
                    onTemperatureChange={setTemperature}
                />
            </Box>

            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: { xs: "min(70vh, 640px)", md: "100vh" },
                    minWidth: 0,
                    backgroundColor: (t) =>
                        t.palette.mode === "dark" ? t.palette.grey[900] : "#ffffff",
                }}
            >
                {errorMessage ? (
                    <Alert severity="error" sx={{ m: 1.5, flexShrink: 0 }}>
                        {errorMessage}
                    </Alert>
                ) : null}

                <Box
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        pt: 2,
                        pb: 1,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                    }}
                >
                    <Box sx={{ flex: 1 }} />
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
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
                        <ThemeSwitcher size="small" />
                    </Stack>
                </Box>

                <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 1.5, flexShrink: 0 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            mx: "auto",
                            maxWidth: 560,
                            py: 1.75,
                            px: 3,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            textAlign: "center",
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? theme.palette.grey[800]
                                    : theme.palette.grey[50],
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                color: "secondary.main",
                                letterSpacing: 0.2,
                            }}
                        >
                            Doc Assist — Chat{" "}
                            <Box component="span" aria-hidden>
                                🤖
                            </Box>
                        </Typography>
                    </Paper>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        overflowY: "auto",
                        px: { xs: 1.5, sm: 2 },
                        py: 1,
                        scrollPaddingTop: 8,
                    }}
                >
                    {conversation.length === 0 && !streamingQuery && !isSubmitting ? (
                        <Box
                            sx={{
                                minHeight: "40%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                px: 2,
                            }}
                        >
                            <Stack spacing={0.75} sx={{ textAlign: "center", maxWidth: 420 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    Start a conversation
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Ask about your documents for grounded answers, or turn off
                                    RAG mode in the sidebar for a general assistant.
                                </Typography>
                            </Stack>
                        </Box>
                    ) : null}

                    {conversation.map((item) => (
                        <Stack key={item.id} spacing={1.25} sx={{ mb: 2.5 }}>
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                                    <Typography variant="body2">{item.query}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                <Box
                                    sx={(t) => {
                                        const a = getAssistantMessageTokens(t);
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
                                        sx={(t) => ({
                                            color: getAssistantMessageTokens(t).onSurfaceIcon,
                                        })}
                                    />
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                        {item.answer ?? "No answer returned."}
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
                                <Typography variant="body2">{streamingQuery}</Typography>
                            </Box>
                        </Box>
                    ) : null}

                    {isSubmitting ? (
                        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                            <Box
                                sx={(t) => {
                                    const a = getAssistantMessageTokens(t);
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
                                    sx={(t) => ({
                                        color: getAssistantMessageTokens(t).onSurfaceIcon,
                                    })}
                                />
                                <Typography
                                    variant="body2"
                                    sx={(t) => ({
                                        color: getAssistantMessageTokens(t).onSurfaceMuted,
                                    })}
                                >
                                    {streamingAnswer || "Thinking through your question..."}
                                </Typography>
                            </Box>
                        </Box>
                    ) : null}

                    <Box ref={messagesEndRef} />
                </Box>

                <Box
                    sx={{
                        p: { xs: 1.5, sm: 2 },
                        pt: 1,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        flexShrink: 0,
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
                        variant="chatBar"
                    />
                </Box>
            </Box>
        </Box>
    );
}
