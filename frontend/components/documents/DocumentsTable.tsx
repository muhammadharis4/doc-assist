"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import {
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import type { DocumentItem } from "@/lib/types/documents";

interface DocumentsTableProps {
    documents: DocumentItem[];
    isLoading: boolean;
    onDelete: (id: string) => Promise<void>;
    deletingId: string | null;
}

/**
 * Shows uploaded files in a compact table with delete actions at row end.
 */
export function DocumentsTable({
    documents,
    isLoading,
    onDelete,
    deletingId,
}: DocumentsTableProps) {
    if (isLoading) {
        return (
            <Paper sx={{ p: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
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
                            <TableCell width="24%">Uploaded date</TableCell>
                            <TableCell width="24%">Type</TableCell>
                            <TableCell align="right" width="8%">
                                Delete
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4}>
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
                                            {document.mimeType ?? "Unknown"}
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
