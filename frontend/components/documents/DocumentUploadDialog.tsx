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
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { extractPdfText } from "@/lib/api/documents";
import {
    DOCUMENT_TYPE_OPTIONS,
    type CreateDocumentInput,
    type DocumentType,
} from "@/lib/types/documents";

interface DocumentUploadDialogProps {
    /** Controls MUI `Dialog` visibility. */
    open: boolean;
    /** Fired when the dialog is dismissed (and reset) without blocking submit. */
    onClose: () => void;
    /** Persists all staged files; parent runs API calls. */
    onSubmit: (payload: CreateDocumentInput[]) => Promise<void>;
    /** Disables close / upload UI while a batch is in progress. */
    isSubmitting: boolean;
}

/** In-memory row before the user commits upload. */
interface PendingFile {
    file: File;
    extractedText: string;
    documentType: DocumentType;
}

/**
 * Multi-file upload dialog: pick/drop PDFs, optional OCR, type per row, then submit.
 * @param props - See `DocumentUploadDialogProps`.
 * @returns A MUI `Dialog` with a dropzone, file list, and confirm action.
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

    /** Clears local staging when closing or after a successful submit. */
    function resetDialog() {
        setPendingFiles([]);
        setErrorMessage("");
        setIsDragging(false);
    }

    /** Closes the dialog and resets unless a submit is in progress. */
    function handleClose() {
        if (isSubmitting) {
            return;
        }

        resetDialog();
        onClose();
    }

    /**
     * Appends selected/dropped files; extracts text (PDFs via `extractPdfText`, else UTF-8).
     * @param selectedFiles - Picked or dropped `File` list.
     */
    async function handleFiles(selectedFiles: File[]) {
        if (selectedFiles.length === 0) {
            return;
        }

        const loaded = await Promise.all(
            selectedFiles.map(async (file) => ({
                file,
                extractedText: await readFileText(file),
                documentType: "other" as DocumentType,
            })),
        );

        setPendingFiles((current) => [...current, ...loaded]);
        setErrorMessage("");
    }

    /**
     * Builds `CreateDocumentInput[]` and delegates to the parent; resets on success.
     * @returns Promise that resolves when `onSubmit` finishes.
     */
    async function handleSubmit() {
        if (!hasFiles) {
            setErrorMessage("Choose at least one file.");
            return;
        }

        setErrorMessage("");
        await onSubmit(
            pendingFiles.map((item) =>
                buildPayload(item.file, item.extractedText, item.documentType),
            ),
        );
        resetDialog();
        onClose();
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: "background.paper",
                        color: "text.primary",
                    },
                },
            }}
        >
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
                                ? alpha(theme.palette.primary.main, 0.08)
                                : theme.palette.mode === "dark"
                                  ? theme.palette.grey[900]
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
                                            <Box sx={{ mt: 1, maxWidth: 240 }}>
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    value={item.documentType}
                                                    onChange={(event) => {
                                                        const value = event
                                                            .target
                                                            .value as DocumentType;
                                                        setPendingFiles(
                                                            (current) =>
                                                                current.map(
                                                                    (
                                                                        candidate,
                                                                    ) => {
                                                                        const candidateKey = `${candidate.file.name}-${candidate.file.lastModified}`;
                                                                        const itemKey = `${item.file.name}-${item.file.lastModified}`;
                                                                        if (
                                                                            candidateKey !==
                                                                            itemKey
                                                                        ) {
                                                                            return candidate;
                                                                        }
                                                                        return {
                                                                            ...candidate,
                                                                            documentType:
                                                                                value,
                                                                        };
                                                                    },
                                                                ),
                                                        );
                                                    }}
                                                >
                                                    {DOCUMENT_TYPE_OPTIONS.map(
                                                        (option) => (
                                                            <MenuItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </MenuItem>
                                                        ),
                                                    )}
                                                </Select>
                                            </Box>
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

/**
 * Maps a staged file + type into the create-document API body.
 * @param file - Original file.
 * @param extractedText - Plain text (or filename fallback).
 * @param documentType - User-chosen `DocumentType`.
 * @returns `CreateDocumentInput` for the backend.
 */
function buildPayload(
    file: File,
    extractedText: string,
    documentType: DocumentType,
): CreateDocumentInput {
    return {
        filename: file.name,
        mimeType: file.type || "text/plain",
        content: extractedText.trim() || file.name,
        documentType,
    };
}

/**
 * Reads `File` contents: PDFs go through `extractPdfText`, other types use `file.text()`.
 * @param file - User-selected file.
 * @returns Text used as document `content` (at least the filename on failure).
 */
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
