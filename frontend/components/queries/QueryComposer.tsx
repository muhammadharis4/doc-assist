"use client";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

interface QueryComposerProps {
    /** Controlled value of the multiline field. */
    queryText: string;
    /** Updates `queryText` on each keystroke. */
    onQueryTextChange: (value: string) => void;
    /** Fires when the user sends (or Ctrl/Cmd+Enter from the field). */
    onSubmit: () => void;
    /** Disables the send action while a request is in flight. */
    isSubmitting: boolean;
    /** Max characters allowed in the text field. */
    maxLength: number;
    /** Hides the “Ask a question” heading and some chrome for the chat area. */
    embedded?: boolean;
    /** Compact single-line-style bar used on the chat page. */
    variant?: "default" | "chatBar";
}

/**
 * Multiline input + send control for RAG questions (Ctrl+Enter to submit when not embedded).
 * @param props - See `QueryComposerProps`.
 * @returns A `Paper` with text field, character limit, and send button.
 */
export function QueryComposer({
    queryText,
    onQueryTextChange,
    onSubmit,
    isSubmitting,
    maxLength,
    embedded = false,
    variant = "default",
}: QueryComposerProps) {
    const isEmpty = queryText.trim().length === 0;

    if (variant === "chatBar") {
        return (
            <Box sx={{ width: "100%" }}>
                <TextField
                    fullWidth
                    placeholder="Type your message here..."
                    multiline
                    minRows={1}
                    maxRows={5}
                    size="small"
                    value={queryText}
                    onChange={(event) => onQueryTextChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            if (!isSubmitting && !isEmpty) {
                                onSubmit();
                            }
                            return;
                        }
                        if (
                            event.key === "Enter" &&
                            (event.metaKey || event.ctrlKey)
                        ) {
                            event.preventDefault();
                            onSubmit();
                        }
                    }}
                    slotProps={{
                        htmlInput: { maxLength },
                        input: {
                            sx: (theme) => ({
                                borderRadius: 999,
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? theme.palette.grey[900]
                                        : theme.palette.grey[100],
                                pl: 2,
                                pr: 0.5,
                            }),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Send">
                                        <span>
                                            <IconButton
                                                color="primary"
                                                edge="end"
                                                onClick={onSubmit}
                                                disabled={isSubmitting || isEmpty}
                                                aria-label="Send message"
                                            >
                                                <SendRoundedIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: embedded ? 0 : 3,
                border: embedded ? "none" : "1px solid",
                borderColor: embedded ? undefined : "divider",
                backgroundColor: embedded ? "transparent" : "background.paper",
            }}
        >
            <Stack spacing={2}>
                {!embedded ? (
                    <Typography variant="h6">Ask a question</Typography>
                ) : null}

                <TextField
                    label="Your question"
                    placeholder="What does the policy say about onboarding?"
                    multiline
                    minRows={embedded ? 2 : 3}
                    maxRows={embedded ? 4 : 6}
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
                    helperText={
                        embedded
                            ? undefined
                            : "Use Ctrl+Enter to submit quickly"
                    }
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

                    {embedded ? (
                        <Tooltip title="Send (Ctrl+Enter)">
                            <span>
                                <IconButton
                                    color="primary"
                                    onClick={onSubmit}
                                    disabled={isSubmitting || isEmpty}
                                    aria-label="Send query"
                                >
                                    <SendRoundedIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<SendRoundedIcon />}
                            onClick={onSubmit}
                            disabled={isSubmitting || isEmpty}
                        >
                            {isSubmitting ? "Running..." : "Send"}
                        </Button>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}
