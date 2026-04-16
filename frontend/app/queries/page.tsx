"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import {
    Alert,
    Box,
    Button,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import { AnswerPanel } from "@/components/queries/AnswerPanel";
import { HistoryList } from "@/components/queries/HistoryList";
import { QueryComposer } from "@/components/queries/QueryComposer";
import { SourcesList } from "@/components/queries/SourcesList";
import { executeQuery, getQueryHistory } from "@/lib/api/queries";
import { getErrorMessage } from "@/lib/types/api";
import {
    MAX_QUERY_LENGTH,
    type QueryHistoryItem,
    type QuerySource,
} from "@/lib/types/queries";

/**
 * Provides query execution, answer rendering, and recent history.
 */
export default function QueriesPage() {
    const [queryText, setQueryText] = useState("");
    const [history, setHistory] = useState<QueryHistoryItem[]>([]);
    const [latestAnswer, setLatestAnswer] = useState<string | null>(null);
    const [latestSources, setLatestSources] = useState<QuerySource[]>([]);
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
                setLatestAnswer(result.answer);
                setLatestSources(result.sources);
                setHistory((current) => [
                    result,
                    ...current.filter((item) => item.id !== result.id),
                ]);
            } catch (error: unknown) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setIsSubmitting(false);
            }
        },
        [isSubmitting],
    );

    const pageSubtitle = useMemo(() => {
        if (isLoadingHistory) {
            return "Loading your recent questions...";
        }

        if (history.length === 0) {
            return "Ask your first question and we will keep the recent history here.";
        }

        return `Showing ${history.length} recent quer${history.length > 1 ? "ies" : "y"}.`;
    }, [history.length, isLoadingHistory]);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        flexDirection: { xs: "column", sm: "row" },
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

                <QueryComposer
                    queryText={queryText}
                    onQueryTextChange={setQueryText}
                    onSubmit={() => {
                        void runQuery(queryText);
                    }}
                    isSubmitting={isSubmitting}
                    maxLength={MAX_QUERY_LENGTH}
                />

                <AnswerPanel answer={latestAnswer} isLoading={isSubmitting} />

                <SourcesList sources={latestSources} />

                <HistoryList
                    history={history}
                    onReuseQuery={(query) => {
                        setQueryText(query);
                        void runQuery(query);
                    }}
                />

                <Button
                    variant="text"
                    startIcon={<AutoAwesomeRoundedIcon />}
                    onClick={() => {
                        void refreshHistory();
                    }}
                    sx={{ alignSelf: "flex-start" }}
                >
                    Refresh history
                </Button>
            </Stack>
        </Container>
    );
}
