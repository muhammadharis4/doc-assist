"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import {
    createDocument,
    deleteDocument,
    listDocuments,
} from "@/lib/api/documents";
import { getErrorMessage } from "@/lib/types/api";
import type { DocumentItem } from "@/lib/types/documents";

/**
 * Hosts the document upload and list experience.
 */
export default function Home() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const refreshDocuments = useCallback(
        async (options?: { silent?: boolean }) => {
            if (!options?.silent) {
                setIsLoading(true);
            }

            try {
                const nextDocuments = await listDocuments();
                setDocuments(nextDocuments);
                setErrorMessage("");
            } catch (error: unknown) {
                if (!options?.silent) {
                    setErrorMessage(getErrorMessage(error));
                }
            } finally {
                if (!options?.silent) {
                    setIsLoading(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        void refreshDocuments();
    }, [refreshDocuments]);

    useEffect(() => {
        const hasRunningWork = documents.some(
            (document) =>
                document.status === "pending" ||
                document.status === "processing",
        );

        if (!hasRunningWork) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void refreshDocuments({ silent: true });
        }, 2500);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [documents, refreshDocuments]);

    const handleDelete = useCallback(
        async (id: string) => {
            const snapshot = documents.find((document) => document.id === id);
            if (!snapshot) {
                return;
            }

            setDeletingId(id);
            setErrorMessage("");
            setDocuments((current) =>
                current.filter((document) => document.id !== id),
            );

            try {
                await deleteDocument(id);
            } catch (error: unknown) {
                setDocuments((current) => [snapshot, ...current]);
                setErrorMessage(getErrorMessage(error));
            } finally {
                setDeletingId(null);
            }
        },
        [documents],
    );

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3.5 },
                        background:
                            "linear-gradient(135deg, #eff6ff 0%, #ffffff 60%)",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "flex-start", sm: "center" },
                            justifyContent: "space-between",
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
                                Documents
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, maxWidth: 720 }}
                            >
                                Add files, keep the list simple, and delete rows
                                when you do not need them anymore.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setIsUploadOpen(true)}
                        >
                            Add files
                        </Button>
                        <Button
                            component={Link}
                            href="/queries"
                            variant="outlined"
                            size="large"
                            startIcon={<SearchRoundedIcon />}
                        >
                            Open queries
                        </Button>
                    </Box>
                </Paper>

                {errorMessage ? (
                    <Alert severity="error">{errorMessage}</Alert>
                ) : null}

                {successMessage ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 1.5,
                            borderColor: "success.light",
                            color: "success.dark",
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {successMessage}
                        </Typography>
                    </Paper>
                ) : null}

                <DocumentsTable
                    documents={documents}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                />
            </Stack>

            <DocumentUploadDialog
                open={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSubmit={async (payloads) => {
                    setIsSubmitting(true);
                    setErrorMessage("");
                    setSuccessMessage("");

                    try {
                        for (const payload of payloads) {
                            await createDocument(payload);
                        }

                        setSuccessMessage(
                            `${payloads.length} file${payloads.length > 1 ? "s" : ""} uploaded. Processing started in background.`,
                        );
                        await refreshDocuments();
                    } catch (error: unknown) {
                        setErrorMessage(getErrorMessage(error));
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
                isSubmitting={isSubmitting}
            />
        </Container>
    );
}
