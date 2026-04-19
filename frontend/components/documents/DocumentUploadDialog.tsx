"use client";

import { useMemo, useState } from "react";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { extractPdfText } from "@/lib/api/documents";
import type { CreateDocumentInput } from "@/lib/types/documents";

interface DocumentUploadDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateDocumentInput[]) => Promise<void>;
    isSubmitting: boolean;
}

interface PendingFile {
    file: File;
    extractedText: string;
}

/**
 * Lets users add one or more files through drag-and-drop or the file picker.
 */
export function DocumentUploadDialog({
    open,
    onClose,
    onSubmit,
    isSubmitting,
}: DocumentUploadDialogProps) {
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const hasFiles = pendingFiles.length > 0;
    const dropHint = useMemo(() => {
        if (isDragging) {
            return "Drop files here";
        }

        if (hasFiles) {
            return `${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""} ready`;
        }

        return "Drag files here or choose from your device";
    }, [hasFiles, isDragging, pendingFiles.length]);

    function resetDialog() {
        setPendingFiles([]);
        setErrorMessage("");
        setIsDragging(false);
    }

    function handleClose() {
        if (isSubmitting) {
            return;
        }

        resetDialog();
        onClose();
    }

    async function handleFiles(selectedFiles: File[]) {
        if (selectedFiles.length === 0) {
            return;
        }

        const loaded = await Promise.all(
            selectedFiles.map(async (file) => ({
                file,
                extractedText: await readFileText(file),
            })),
        );

        setPendingFiles((current) => [...current, ...loaded]);
        setErrorMessage("");
    }

    async function handleSubmit() {
        if (!hasFiles) {
            setErrorMessage("Choose at least one file.");
            return;
        }

        setErrorMessage("");
        await onSubmit(
            pendingFiles.map((item) =>
                buildPayload(item.file, item.extractedText),
            ),
        );
        resetDialog();
        onClose();
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pb: 1 }}>Upload files</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Box
                        onDragEnter={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={async (event) => {
                            event.preventDefault();
                            setIsDragging(false);
                            await handleFiles(
                                Array.from(event.dataTransfer.files),
                            );
                        }}
                        sx={(theme) => ({
                            minHeight: 220,
                            borderRadius: 3,
                            border: "2px dashed",
                            borderColor: isDragging
                                ? theme.palette.primary.main
                                : theme.palette.divider,
                            backgroundColor: isDragging
                                ? "rgba(37, 99, 235, 0.05)"
                                : theme.palette.grey[50],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            px: 3,
                            py: 4,
                            transition: "all 0.2s ease",
                        })}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <CloudUploadRoundedIcon
                                color="primary"
                                sx={{ fontSize: 44 }}
                            />
                            <Typography variant="h6">{dropHint}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                You can add one or multiple files. Text files
                                are read into the searchable content field.
                            </Typography>
                            <Button
                                variant="contained"
                                component="label"
                                size="large"
                            >
                                Select files
                                <input
                                    hidden
                                    type="file"
                                    multiple
                                    onChange={async (event) => {
                                        const files = Array.from(
                                            event.target.files ?? [],
                                        );
                                        await handleFiles(files);
                                        event.target.value = "";
                                    }}
                                />
                            </Button>
                        </Box>
                    </Box>

                    {errorMessage ? (
                        <Typography variant="body2" color="error">
                            {errorMessage}
                        </Typography>
                    ) : null}

                    {pendingFiles.length > 0 ? (
                        <Stack spacing={1}>
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                            >
                                Files ready to upload
                            </Typography>
                            {pendingFiles.map((item) => (
                                <Box
                                    key={`${item.file.name}-${item.file.lastModified}`}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        px: 2,
                                        py: 1.25,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                        }}
                                    >
                                        <InsertDriveFileRoundedIcon
                                            fontSize="small"
                                            color="action"
                                        />
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                {item.file.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {item.file.type ||
                                                    "application/octet-stream"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton
                                        aria-label={`Remove ${item.file.name}`}
                                        onClick={() =>
                                            setPendingFiles((current) =>
                                                current.filter(
                                                    (candidate) =>
                                                        `${candidate.file.name}-${candidate.file.lastModified}` !==
                                                        `${item.file.name}-${item.file.lastModified}`,
                                                ),
                                            )
                                        }
                                        size="small"
                                    >
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Stack>
                    ) : null}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={!hasFiles || isSubmitting}
                >
                    {isSubmitting ? "Uploading..." : "Upload"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function buildPayload(file: File, extractedText: string): CreateDocumentInput {
    return {
        filename: file.name,
        mimeType: file.type || "text/plain",
        content: extractedText.trim() || file.name,
    };
}

async function readFileText(file: File): Promise<string> {
    const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
        return (await extractPdfText(file)).trim() || file.name;
    }

    try {
        const content = await file.text();
        return content.trim() || file.name;
    } catch {
        return file.name;
    }
}
