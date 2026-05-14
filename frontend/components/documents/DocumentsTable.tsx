"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import {
    Box,
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
} from "@/types/documents";

interface DocumentsTableProps {
    /** Current rows; empty shows an empty state (after loading). */
    documents: DocumentItem[];
    /** True while the parent is fetching the first page. */
    isLoading: boolean;
    /** Deletes by id; parent handles optimistic UI and errors. */
    onDelete: (id: string) => Promise<void>;
    /** If set, that row’s delete control is in a loading state. */
    deletingId: string | null;
    /** Opens tag editor for a row. */
    onEditTags?: (document: DocumentItem) => void;
    /** When filters are active, empty copy explains no matches vs no uploads. */
    filtersActive: boolean;
}

/**
 * Table of uploads with name, date, type, tags, status, and actions.
 * @param props - See `DocumentsTableProps`.
 * @returns A `TableContainer` (or full-width skeletons while `isLoading`).
 */
export function DocumentsTable({
    documents,
    isLoading,
    onDelete,
    deletingId,
    onEditTags,
    filtersActive,
}: DocumentsTableProps) {
    if (isLoading) {
        return (
            <Paper sx={{ overflow: "hidden" }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width="28%">File name</TableCell>
                                <TableCell width="14%">Uploaded</TableCell>
                                <TableCell width="16%">Type</TableCell>
                                <TableCell width="18%">Tags</TableCell>
                                <TableCell width="14%">Status</TableCell>
                                <TableCell align="right" width="10%">
                                    Actions
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
                                        <Skeleton width="80%" height={24} />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton width={74} height={28} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Skeleton
                                            width={80}
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
                            <TableCell width="28%">File name</TableCell>
                            <TableCell width="14%">Uploaded</TableCell>
                            <TableCell width="16%">Type</TableCell>
                            <TableCell width="18%">Tags</TableCell>
                            <TableCell width="14%">Status</TableCell>
                            <TableCell align="right" width="10%">
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {filtersActive
                                            ? "No files match these filters."
                                            : "No uploaded files yet."}
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
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {(document.tags ?? []).map(
                                                    (tag) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ),
                                                )}
                                            </Box>
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
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "flex-end",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {onEditTags ? (
                                                    <IconButton
                                                        aria-label={`Edit tags for ${document.filename}`}
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => {
                                                            onEditTags(document);
                                                        }}
                                                        disabled={isDeleting}
                                                    >
                                                        <EditRoundedIcon />
                                                    </IconButton>
                                                ) : null}
                                                <IconButton
                                                    aria-label={`Delete ${document.filename}`}
                                                    color="error"
                                                    size="small"
                                                    onClick={() => {
                                                        void onDelete(document.id);
                                                    }}
                                                    disabled={isDeleting}
                                                >
                                                    <DeleteOutlineRoundedIcon />
                                                </IconButton>
                                            </Box>
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
