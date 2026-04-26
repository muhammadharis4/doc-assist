"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
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
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { NavHomeButton } from "@/components/NavHomeButton";
import {
    createDocument,
    deleteDocument,
    listDocuments,
} from "@/lib/api/documents";
import { getErrorMessage } from "@/lib/types/api";
import type { DocumentItem } from "@/lib/types/documents";

/**
 * Document upload and list.
 */
export default function DocumentsPage() {
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
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
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
                            gap: 1.5,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <DescriptionRoundedIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Documents
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <NavHomeButton />
                            <Tooltip title="Add files">
                                <IconButton
                                    color="primary"
                                    onClick={() => setIsUploadOpen(true)}
                                    aria-label="Add files"
                                >
                                    <AddRoundedIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Open chat">
                                <IconButton
                                    component={Link}
                                    href="/chat"
                                    color="primary"
                                    aria-label="Open chat"
                                >
                                    <ChatRoundedIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
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
