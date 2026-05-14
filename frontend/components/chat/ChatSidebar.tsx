"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    IconButton,
    Paper,
    Slider,
    Stack,
    Typography,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RecentChatsPanel } from "@/components/chat/RecentChatsPanel";
import { getChatShellTokens } from "@/libs/theme";
import type { QueryHistoryItem } from "@/types/queries";

const TOP_K_MIN = 1;
const TOP_K_MAX = 20;

interface ChatSidebarProps {
    history: QueryHistoryItem[];
    isLoadingHistory: boolean;
    deletingHistoryId: string | null;
    onReuseQuery: (query: string) => void;
    onDeleteHistory: (id: string) => void;
    ragEnabled: boolean;
    onRagEnabledChange: (value: boolean) => void;
    topK: number;
    onTopKChange: (value: number) => void;
    temperature: number;
    onTemperatureChange: (value: number) => void;
}

/**
 * Left rail styled like a classic chatbot shell: primary nav, RAG tuning, and history.
 * @param props - Navigation targets, RAG controls, and recent chat props.
 * @returns Fixed-width sidebar content inside a `Paper`.
 */
export function ChatSidebar({
    history,
    isLoadingHistory,
    deletingHistoryId,
    onReuseQuery,
    onDeleteHistory,
    ragEnabled,
    onRagEnabledChange,
    topK,
    onTopKChange,
    temperature,
    onTemperatureChange,
}: ChatSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const onChat = pathname === "/chat" || pathname === "/chat/";
    const onDocuments = pathname?.startsWith("/documents") ?? false;

    const bumpTopK = (delta: number) => {
        onTopKChange(
            Math.min(TOP_K_MAX, Math.max(TOP_K_MIN, topK + delta)),
        );
    };

    return (
        <Paper
            elevation={0}
            sx={(theme) => {
                const c = getChatShellTokens(theme);
                return {
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    border: "1px solid",
                    borderColor: c.subtleBorder,
                    backgroundColor: c.historyRailBg,
                    borderRadius: { xs: 2, md: 0 },
                };
            }}
        >
            <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                <Box>
                    <Typography
                        variant="overline"
                        sx={{ color: "text.secondary", letterSpacing: 1.2 }}
                    >
                        Doc Assist
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Welcome
                    </Typography>
                </Box>

                <Stack spacing={0.5}>
                    <SidebarNavRow
                        label="Chatbot"
                        icon={<SmartToyRoundedIcon fontSize="small" />}
                        selected={onChat}
                        onClick={() => router.push("/chat")}
                    />
                    <SidebarNavRow
                        label="Upload documents"
                        icon={<DescriptionRoundedIcon fontSize="small" />}
                        selected={onDocuments}
                        onClick={() => router.push("/documents")}
                    />
                </Stack>

                <Divider flexItem />

                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        RAG configuration
                    </Typography>
                    <Stack spacing={1.5}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={ragEnabled}
                                    onChange={(_, checked) =>
                                        onRagEnabledChange(checked)
                                    }
                                    size="small"
                                    sx={{
                                        color: "text.secondary",
                                        "&.Mui-checked": { color: "error.main" },
                                    }}
                                />
                            }
                            label="Enable RAG mode"
                            sx={{
                                alignItems: "center",
                                m: 0,
                                "& .MuiFormControlLabel-label": {
                                    fontSize: "0.875rem",
                                },
                            }}
                        />

                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5 }}
                            >
                                Number of results in context window
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                            >
                                <IconButton
                                    size="small"
                                    aria-label="Decrease context results"
                                    onClick={() => bumpTopK(-1)}
                                    disabled={!ragEnabled || topK <= TOP_K_MIN}
                                >
                                    <RemoveRoundedIcon fontSize="small" />
                                </IconButton>
                                <Typography
                                    variant="body2"
                                    sx={{ minWidth: 28, textAlign: "center", fontWeight: 700 }}
                                >
                                    {topK}
                                </Typography>
                                <IconButton
                                    size="small"
                                    aria-label="Increase context results"
                                    onClick={() => bumpTopK(1)}
                                    disabled={!ragEnabled || topK >= TOP_K_MAX}
                                >
                                    <AddRoundedIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>

                        <Box>
                            <Stack
                                direction="row"
                                sx={{
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    Response temperature
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                    {temperature.toFixed(2)}
                                </Typography>
                            </Stack>
                            <Slider
                                size="small"
                                color="error"
                                min={0}
                                max={1}
                                step={0.01}
                                value={temperature}
                                onChange={(_, value) =>
                                    onTemperatureChange(
                                        Array.isArray(value) ? value[0] : value,
                                    )
                                }
                                sx={{ mt: 0.5 }}
                            />
                        </Box>
                    </Stack>
                </Box>

                <Divider flexItem />

                <RecentChatsPanel
                    history={history}
                    isLoading={isLoadingHistory}
                    onReuseQuery={onReuseQuery}
                    onDeleteHistory={onDeleteHistory}
                    deletingHistoryId={deletingHistoryId}
                />
            </Stack>

            <Box sx={{ pt: 2, mt: "auto" }}>
                <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <ChatRoundedIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            Doc Assist
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        Your document assistant
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        Powered by Doc Assist
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        © {new Date().getFullYear()} Doc Assist
                    </Typography>
                </Stack>
            </Box>
        </Paper>
    );
}

function SidebarNavRow({
    label,
    icon,
    selected,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            sx={(theme) => ({
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 1,
                px: 1.25,
                border: "none",
                borderRadius: 1,
                cursor: "pointer",
                textAlign: "left",
                font: "inherit",
                backgroundColor: selected
                    ? theme.palette.action.selected
                    : "transparent",
                color: theme.palette.text.primary,
                transition: theme.transitions.create(["background-color"], {
                    duration: theme.transitions.duration.shorter,
                }),
                "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                },
            })}
        >
            {icon}
            <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 500 }}>
                {label}
            </Typography>
        </Box>
    );
}
