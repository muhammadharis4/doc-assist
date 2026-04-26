"use client";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import {
    Box,
    ButtonBase,
    Collapse,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import type { QueryHistoryItem } from "@/lib/types/queries";

interface HistoryListProps {
    /** Newest items first is typical; list is re-rendered from parent. */
    history: QueryHistoryItem[];
    /** Fills the composer (and may auto-submit) with a past question. */
    onReuseQuery: (query: string) => void;
    /** Permanently removes a history item after confirmation. */
    onDeleteHistory: (id: string) => void;
    /** Clears streaming / draft state for a fresh turn. */
    onNewChat: () => void;
    /** Navigates to the documents view (uploaded files). */
    onOpenDocuments: () => void;
    /** When set, shows loading state on the matching row’s delete control. */
    deletingHistoryId: string | null;
    /** Replaces the list with skeletons while the initial fetch runs. */
    isLoading: boolean;
    /** Narrow rail mode vs expanded history. */
    isCollapsed: boolean;
    /** Toggles `isCollapsed`. */
    onToggleCollapsed: () => void;
}

/**
 * Collapsible left rail: chat history, quick actions, and per-row delete.
 * @param props - See `HistoryListProps`.
 * @returns A `Paper` column or slim icon strip when `isCollapsed`.
 */
export function HistoryList({
    history,
    onReuseQuery,
    onDeleteHistory,
    onNewChat,
    onOpenDocuments,
    deletingHistoryId,
    isLoading,
    isCollapsed,
    onToggleCollapsed,
}: HistoryListProps) {
    return (
        <Paper
            sx={(theme) => ({
                p: isCollapsed ? 1 : 1.25,
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#101010",
                width: isCollapsed ? 56 : "100%",
                minWidth: isCollapsed ? 56 : 0,
                overflow: "hidden",
                borderRadius: 1.5,
                color: "#e7ecf7",
                transition: theme.transitions.create(["width", "padding"], {
                    duration: theme.transitions.duration.shorter,
                }),
            })}
        >
            <Stack spacing={1.75}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isCollapsed
                            ? "center"
                            : "space-between",
                        gap: 1,
                        minHeight: 28,
                    }}
                >
                    {!isCollapsed && (
                        <Typography variant="caption" sx={{ color: "#9aa3b8" }}>
                            DOC ASSIST
                        </Typography>
                    )}
                    <IconButton
                        size="small"
                        onClick={onToggleCollapsed}
                        aria-label={
                            isCollapsed
                                ? "Expand chat history"
                                : "Collapse chat history"
                        }
                        sx={{ color: "#cfd6e6" }}
                    >
                        {isCollapsed ? (
                            <KeyboardArrowRightRoundedIcon fontSize="small" />
                        ) : (
                            <KeyboardArrowDownRoundedIcon fontSize="small" />
                        )}
                    </IconButton>
                </Box>

                {isCollapsed ? (
                    <Stack spacing={0.5} sx={{ alignItems: "center", pt: 0.5 }}>
                        <Tooltip title="New chat" placement="right">
                            <IconButton
                                size="small"
                                onClick={onNewChat}
                                aria-label="New chat"
                                sx={{ color: "#e6ecff" }}
                            >
                                <NoteAddRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Documents" placement="right">
                            <IconButton
                                size="small"
                                onClick={onOpenDocuments}
                                aria-label="Open documents"
                                sx={{ color: "#e6ecff" }}
                            >
                                <DescriptionRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ) : (
                    <Stack spacing={0.4}>
                        <SidebarAction
                            label="New chat"
                            icon={<EditNoteRoundedIcon fontSize="small" />}
                            onClick={onNewChat}
                        />
                        <SidebarAction
                            label="Documents"
                            icon={<DescriptionRoundedIcon fontSize="small" />}
                            onClick={onOpenDocuments}
                        />
                    </Stack>
                )}

                <Collapse in={!isCollapsed} timeout={180} unmountOnExit>
                    <Stack spacing={1.5}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography variant="caption" sx={{ color: "#9aa3b8" }}>
                                Recent chats
                            </Typography>
                        </Box>

                        {isLoading
                            ? Array.from({ length: 3 }).map((_, index) => (
                                  <Paper
                                      key={index}
                                      elevation={0}
                                      sx={{
                                          p: 1,
                                          borderRadius: 2,
                                          backgroundColor: "#0d0d0d",
                                          border: "1px solid rgba(255,255,255,0.08)",
                                      }}
                                  >
                                      <Skeleton width="72%" />
                                      <Skeleton width="46%" />
                                  </Paper>
                              ))
                            : history.length === 0
                              ? null
                              : history.map((item) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            borderRadius: 2,
                                            p: 0.9,
                                            backgroundColor: "#0d0d0d",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 0.75,
                                        }}
                                    >
                                        <ButtonBase
                                            onClick={() =>
                                                onReuseQuery(item.query)
                                            }
                                            sx={{
                                                flex: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.8,
                                                justifyContent: "flex-start",
                                                textAlign: "left",
                                                color: "#e7ecf7",
                                                px: 0.4,
                                                py: 0.2,
                                                borderRadius: 1,
                                                minWidth: 0,
                                                overflow: "hidden",
                                                whiteSpace: "nowrap",
                                                textOverflow: "ellipsis",
                                                "&:hover": {
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.04)",
                                                },
                                            }}
                                        >
                                            <ForumRoundedIcon
                                                fontSize="small"
                                                sx={{ color: "#98a1b6" }}
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
                                            onClick={() =>
                                                onDeleteHistory(item.id)
                                            }
                                            disabled={
                                                deletingHistoryId === item.id
                                            }
                                            size="small"
                                            sx={{ color: "#f28b8b" }}
                                        >
                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}

function SidebarAction({
    label,
    icon,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <ButtonBase
            onClick={onClick}
            sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 0.8,
                px: 0.7,
                py: 0.55,
                borderRadius: 1,
                color: "#e7ecf7",
                "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.04)",
                },
            }}
        >
            {icon}
            <Typography variant="body2">{label}</Typography>
        </ButtonBase>
    );
}
