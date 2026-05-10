"use client";

import type { ReactNode } from "react";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

/** One value-prop tile: title, subtitle, and pre-rendered icon. */
export type PillarData = { label: string; sub: string; icon: ReactNode };

/**
 * Data for the three “Your files / language / source-backed” highlight tiles.
 * Used by `LandingPillarRow` (icons are fixed at module load).
 */
export const PILLAR_ITEMS: readonly PillarData[] = [
    {
        label: "Your files",
        sub: "PDFs & text you add",
        icon: <DescriptionRoundedIcon />,
    },
    {
        label: "Your language",
        sub: "DE or EN questions",
        icon: <ChatRoundedIcon />,
    },
    {
        label: "Source-backed",
        sub: "Snippets to verify",
        icon: <FactCheckOutlinedIcon />,
    },
];
