"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import {
    Chip,
    IconButton,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import {
    DOCUMENT_TYPE_OPTIONS,
    type DocumentItem,
    type DocumentType,
} from "@/lib/types/documents";

interface DocumentsTableProps {
    /** Current rows; empty shows an empty state (after loading). */
    documents: DocumentItem[];
    /** True while the parent is fetching the first page. */
    isLoading: boolean;
    /** Deletes by id; parent handles optimistic UI and errors. */
    onDelete: (id: string) => Promise<void>;
    /** If set, that row’s delete control is in a loading state. */
    deletingId: string | null;
}

/**
 * Sortable table of uploads with name, date, type, status, and delete.
 * @param props - See `DocumentsTableProps`.
 * @returns A `TableContainer` (or full-width skeletons while `isLoading`).
 */
export function DocumentsTable({
    documents,
    isLoading,
    onDelete,
    deletingId,
}: DocumentsTableProps) {
    if (isLoading) {
        return (
            <Paper sx={{ overflow: "hidden" }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width="44%">File name</TableCell>
                                <TableCell width="20%">Uploaded date</TableCell>
                                <TableCell width="20%">Type</TableCell>
                                <TableCell width="12%">Status</TableCell>
                                <TableCell align="right" width="8%">
                                    Delete
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton width="72%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton width="65%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton width="58%" />
                                        <Skeleton width="42%" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton width={74} height={28} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Skeleton
                                            width={36}
                                            height={36}
                                            sx={{ ml: "auto" }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        );
    }

    return (
        <Paper sx={{ overflow: "hidden" }}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell width="44%">File name</TableCell>
                            <TableCell width="20%">Uploaded date</TableCell>
                            <TableCell width="20%">Type</TableCell>
                            <TableCell width="12%">Status</TableCell>
                            <TableCell align="right" width="8%">
                                Delete
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        No uploaded files yet.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((document) => {
                                const isDeleting = deletingId === document.id;
                                return (
                                    <TableRow key={document.id} hover>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <InsertDriveFileRoundedIcon
                                                    fontSize="small"
                                                    color="action"
                                                />
                                                {document.filename}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {formatUploadedDate(
                                                document.createdAt,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getDocumentTypeLabel(
                                                    document.documentType,
                                                )}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {document.mimeType ?? "Unknown"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={getStatusLabel(
                                                    document.status,
                                                )}
                                                color={getStatusColor(
                                                    document.status,
                                                )}
                                                variant={
                                                    document.status === "ready"
                                                        ? "filled"
                                                        : "outlined"
                                                }
                                            />
                                            {document.status === "failed" &&
                                            document.errorMessage ? (
                                                <Typography
                                                    variant="caption"
                                                    color="error"
                                                    sx={{
                                                        display: "block",
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    {document.errorMessage}
                                                </Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                aria-label={`Delete ${document.filename}`}
                                                color="error"
                                                onClick={() => {
                                                    void onDelete(document.id);
                                                }}
                                                disabled={isDeleting}
                                            >
                                                <DeleteOutlineRoundedIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

function formatUploadedDate(value: string): string {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(date);
}

function getStatusLabel(status: DocumentItem["status"]): string {
    if (status === "pending") {
        return "Pending";
    }

    if (status === "processing") {
        return "Processing";
    }

    if (status === "failed") {
        return "Failed";
    }

    return "Ready";
}

function getStatusColor(
    status: DocumentItem["status"],
): "default" | "primary" | "error" | "success" | "warning" {
    if (status === "pending") {
        return "warning";
    }

    if (status === "processing") {
        return "primary";
    }

    if (status === "failed") {
        return "error";
    }

    return "success";
}

function getDocumentTypeLabel(value: DocumentType): string {
    const option = DOCUMENT_TYPE_OPTIONS.find((item) => item.value === value);
    return option?.label ?? "Other";
}
