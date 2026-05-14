"use client";

import ClearAllRoundedIcon from "@mui/icons-material/ClearAllRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
    Box,
    Button,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    DOCUMENT_TYPE_OPTIONS,
    type DocumentListParams,
    type DocumentStatus,
} from "@/types/documents";

const STATUS_FILTER_OPTIONS: Array<{
    value: DocumentStatus | "inbox" | "";
    label: string;
}> = [
    { value: "", label: "All statuses" },
    { value: "inbox", label: "Inbox (pending / processing)" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "ready", label: "Ready" },
    { value: "failed", label: "Failed" },
];

interface DocumentsFiltersProps {
    value: DocumentListParams;
    onChange: (next: DocumentListParams) => void;
}

/**
 * Paperless-style toolbar: filename search, type, status/inbox, tag, date range.
 * @param props - Controlled filter state.
 */
export function DocumentsFilters({ value, onChange }: DocumentsFiltersProps) {
    function patch<K extends keyof DocumentListParams>(
        key: K,
        fieldValue: DocumentListParams[K],
    ) {
        onChange({ ...value, [key]: fieldValue });
    }

    const hasFilters = Boolean(
        value.q ||
            value.documentType ||
            value.status ||
            value.tag ||
            value.createdFrom ||
            value.createdTo,
    );

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                    Filter library
                </Typography>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        flexWrap: "wrap",
                        gap: 1.5,
                        alignItems: { md: "flex-end" },
                    }}
                >
                    <TextField
                        size="small"
                        label="Search filename"
                        value={value.q ?? ""}
                        onChange={(event) => patch("q", event.target.value)}
                        sx={{ minWidth: { md: 200 }, flex: { md: "1 1 180px" } }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon
                                            fontSize="small"
                                            color="action"
                                        />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        label="Type"
                        value={value.documentType ?? ""}
                        onChange={(event) =>
                            patch(
                                "documentType",
                                event.target.value as DocumentListParams["documentType"],
                            )
                        }
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="">All types</MenuItem>
                        {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={value.status ?? ""}
                        onChange={(event) =>
                            patch(
                                "status",
                                event.target.value as DocumentListParams["status"],
                            )
                        }
                        sx={{ minWidth: 200 }}
                    >
                        {STATUS_FILTER_OPTIONS.map((option) => (
                            <MenuItem key={option.label} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        size="small"
                        label="Tag"
                        value={value.tag ?? ""}
                        onChange={(event) => patch("tag", event.target.value)}
                        sx={{ minWidth: 140 }}
                    />
                    <TextField
                        size="small"
                        label="From date"
                        type="date"
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                        value={toDateInput(value.createdFrom)}
                        onChange={(event) =>
                            patch("createdFrom", fromDateInput(event.target.value))
                        }
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        label="To date"
                        type="date"
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                        value={toDateInput(value.createdTo)}
                        onChange={(event) =>
                            patch("createdTo", toDateInputEnd(event.target.value))
                        }
                        sx={{ minWidth: 150 }}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ClearAllRoundedIcon />}
                            onClick={() => onChange({})}
                            disabled={!hasFilters}
                        >
                            Clear
                        </Button>
                    </Box>
                </Box>
            </Stack>
        </Paper>
    );
}

function toDateInput(iso: string | undefined): string {
    if (!iso?.trim()) {
        return "";
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return date.toISOString().slice(0, 10);
}

function fromDateInput(dateValue: string): string | undefined {
    if (!dateValue) {
        return undefined;
    }
    return `${dateValue}T00:00:00.000Z`;
}

function toDateInputEnd(dateValue: string): string | undefined {
    if (!dateValue) {
        return undefined;
    }
    return `${dateValue}T23:59:59.999Z`;
}
