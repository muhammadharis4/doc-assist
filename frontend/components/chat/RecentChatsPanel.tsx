"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import {
    Box,
    ButtonBase,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import { getChatShellTokens } from "@/libs/theme";
import type { QueryHistoryItem } from "@/types/queries";

interface RecentChatsPanelProps {
    /** Past queries (newest first). */
    history: QueryHistoryItem[];
    /** Re-runs a stored question. */
    onReuseQuery: (query: string) => void;
    /** Deletes one history row. */
    onDeleteHistory: (id: string) => void;
    /** Row id currently being deleted (disables its delete control). */
    deletingHistoryId: string | null;
    /** Shows skeleton placeholders while history loads. */
    isLoading: boolean;
}

/**
 * Scrollable list of prior chat turns for the left rail.
 * @param props - History rows and row actions.
 * @returns A compact stack of tappable history cards.
 */
export function RecentChatsPanel({
    history,
    onReuseQuery,
    onDeleteHistory,
    deletingHistoryId,
    isLoading,
}: RecentChatsPanelProps) {
    return (
        <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700 }}
            >
                Recent chats
            </Typography>

            {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                      <Paper
                          key={index}
                          elevation={0}
                          sx={(theme) => {
                              const c = getChatShellTokens(theme);
                              return {
                                  p: 1,
                                  borderRadius: 2,
                                  backgroundColor: c.historyCardBg,
                                  border: "1px solid",
                                  borderColor: c.subtleBorder,
                              };
                          }}
                      >
                          <Skeleton width="72%" />
                          <Skeleton width="46%" />
                      </Paper>
                  ))
                : history.length === 0
                  ? (
                        <Typography variant="body2" color="text.secondary">
                            No chats yet. Ask a question to get started.
                        </Typography>
                    )
                  : (
                        history.map((item) => (
                            <Box
                                key={item.id}
                                sx={(theme) => {
                                    const c = getChatShellTokens(theme);
                                    return {
                                        borderRadius: 2,
                                        p: 0.9,
                                        backgroundColor: c.historyCardBg,
                                        border: "1px solid",
                                        borderColor: c.subtleBorder,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 0.75,
                                    };
                                }}
                            >
                                <ButtonBase
                                    onClick={() => onReuseQuery(item.query)}
                                    sx={(theme) => ({
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.8,
                                        justifyContent: "flex-start",
                                        textAlign: "left",
                                        color: theme.palette.text.primary,
                                        px: 0.4,
                                        py: 0.2,
                                        borderRadius: 1,
                                        minWidth: 0,
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        "&:hover": {
                                            backgroundColor: theme.palette.action.hover,
                                        },
                                    })}
                                >
                                    <ForumRoundedIcon
                                        fontSize="small"
                                        sx={{ color: "text.secondary" }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {item.query}
                                    </Typography>
                                </ButtonBase>
                                <IconButton
                                    aria-label={`Delete chat ${item.query}`}
                                    onClick={() => onDeleteHistory(item.id)}
                                    disabled={deletingHistoryId === item.id}
                                    size="small"
                                    sx={{ color: "error.main" }}
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))
                    )}
        </Stack>
    );
}
