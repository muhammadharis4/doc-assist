"use client";

import { useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import { parseDocumentTagsInput } from "@/libs/document-tags";
import { getErrorMessage } from "@/types/api";
import type { DocumentItem } from "@/types/documents";

interface EditDocumentTagsDialogProps {
    document: DocumentItem;
    onClose: () => void;
    /** Persists tags and closes on success; parent handles errors. */
    onSave: (tags: string[]) => Promise<void>;
    isSaving: boolean;
}

/**
 * Simple editor for comma-separated tags (matches backend token rules).
 * Mount only when `document` is set; use `key={document.id}` on the parent to reset state per row.
 * @param props - See `EditDocumentTagsDialogProps`.
 */
export function EditDocumentTagsDialog({
    document,
    onClose,
    onSave,
    isSaving,
}: EditDocumentTagsDialogProps) {
    const [raw, setRaw] = useState(() => document.tags.join(", "));
    const [error, setError] = useState("");

    async function handleSave() {
        setError("");
        let tags: string[];
        try {
            tags = parseDocumentTagsInput(raw);
        } catch (parseError: unknown) {
            setError(
                parseError instanceof Error
                    ? parseError.message
                    : "Invalid tags.",
            );
            return;
        }
        try {
            await onSave(tags);
        } catch (saveError: unknown) {
            setError(getErrorMessage(saveError));
        }
    }

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit tags</DialogTitle>
            <DialogContent>
                {error ? (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {error}
                    </Alert>
                ) : null}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Tags (comma-separated)"
                    helperText="Letters, numbers, spaces, hyphen, dot, underscore. Duplicates removed."
                    fullWidth
                    value={raw}
                    onChange={(event) => {
                        setRaw(event.target.value);
                        if (error) {
                            setError("");
                        }
                    }}
                    disabled={isSaving}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
                <Button onClick={() => void handleSave()} variant="contained" disabled={isSaving}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
