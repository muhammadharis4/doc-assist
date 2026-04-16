"use client";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

interface QueryComposerProps {
    queryText: string;
    onQueryTextChange: (value: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    maxLength: number;
}

/**
 * Collects and submits a query string.
 */
export function QueryComposer({
    queryText,
    onQueryTextChange,
    onSubmit,
    isSubmitting,
    maxLength,
}: QueryComposerProps) {
    const isEmpty = queryText.trim().length === 0;

    return (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={2}>
                <Typography variant="h6">Ask a question</Typography>

                <TextField
                    label="Your question"
                    placeholder="What does the policy say about onboarding?"
                    multiline
                    minRows={3}
                    maxRows={6}
                    value={queryText}
                    onChange={(event) => onQueryTextChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" &&
                            (event.metaKey || event.ctrlKey)
                        ) {
                            event.preventDefault();
                            onSubmit();
                        }
                    }}
                    helperText="Use Ctrl+Enter to submit quickly"
                    slotProps={{ htmlInput: { maxLength } }}
                    fullWidth
                />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {queryText.length}/{maxLength}
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<SendRoundedIcon />}
                        onClick={onSubmit}
                        disabled={isSubmitting || isEmpty}
                    >
                        {isSubmitting ? "Running..." : "Run query"}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}
