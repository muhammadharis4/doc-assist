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

    const refreshDocuments = useCallback(async () => {
        setIsLoading(true);

        try {
            const nextDocuments = await listDocuments();
            setDocuments(nextDocuments);
            setErrorMessage("");
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshDocuments();
    }, [refreshDocuments]);

    const handleDelete = useCallback(
        async (id: string) => {
            setDeletingId(id);
            setErrorMessage("");
            setSuccessMessage("");

            try {
                await deleteDocument(id);
                setSuccessMessage("Document deleted successfully.");
                await refreshDocuments();
            } catch (error: unknown) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setDeletingId(null);
            }
        },
        [refreshDocuments],
    );

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
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
                    <Alert severity="success">{successMessage}</Alert>
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
                            `${payloads.length} file${payloads.length > 1 ? "s" : ""} uploaded successfully.`,
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
