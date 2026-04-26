"use client";

import type { ReactNode } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
    Box,
    Button,
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
    history: QueryHistoryItem[];
    onReuseQuery: (query: string) => void;
    onDeleteHistory: (id: string) => void;
    onNewChat: () => void;
    onOpenDocuments: () => void;
    deletingHistoryId: string | null;
    isLoading: boolean;
    isCollapsed: boolean;
    onToggleCollapsed: () => void;
}

/**
 * Renders recent chat history with rerun and delete actions.
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
                p: isCollapsed ? 1.25 : 2,
                border: "none",
                width: isCollapsed ? 56 : "100%",
                minWidth: isCollapsed ? 56 : 0,
                overflow: "hidden",
                borderRadius: 0,
                backgroundColor: "#000000",
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
                    }}
                >
                    {!isCollapsed && (
                        <Typography
                            variant="overline"
                            sx={{ color: "#95a0b8", letterSpacing: 0.7 }}
                        >
                            Doc Assist
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
                    <Stack spacing={0.5} sx={{ alignItems: "center" }}>
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
                    <Stack spacing={0.5}>
                        <SidebarActionRow
                            label="New chat"
                            icon={<EditNoteRoundedIcon fontSize="small" />}
                            onClick={onNewChat}
                        />

                        <SidebarActionRow
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
                            <Typography
                                variant="overline"
                                sx={{ color: "#95a0b8", letterSpacing: 0.7 }}
                            >
                                Recent chats
                            </Typography>
                            <IconButton size="small" sx={{ color: "#95a0b8" }}>
                                <TuneRoundedIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {isLoading
                            ? Array.from({ length: 3 }).map((_, index) => (
                                  <Paper
                                      key={index}
                                      elevation={0}
                                      sx={{
                                          p: 1.25,
                                          borderRadius: 2,
                                          backgroundColor: "#0c0c0c",
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
                                            p: 1.1,
                                            backgroundColor: "#0c0c0c",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 0.75,
                                        }}
                                    >
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                onReuseQuery(item.query)
                                            }
                                            startIcon={
                                                <FolderRoundedIcon fontSize="small" />
                                            }
                                            sx={{
                                                flex: 1,
                                                justifyContent: "flex-start",
                                                textAlign: "left",
                                                color: "#e7ecf7",
                                                textTransform: "none",
                                                px: 0.25,
                                                minWidth: 0,
                                                overflow: "hidden",
                                                whiteSpace: "nowrap",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {item.query}
                                        </Button>
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

function SidebarActionRow({
    label,
    icon,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <Button
            size="small"
            variant="text"
            startIcon={icon}
            onClick={onClick}
            sx={{
                justifyContent: "flex-start",
                color: "#e7ecf7",
                textTransform: "none",
                px: 0.5,
            }}
        >
            {label}
        </Button>
    );
}
