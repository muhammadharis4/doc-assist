"use client";

import Link from "next/link";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { IconButton, Tooltip } from "@mui/material";

type NavHomeButtonProps = {
    /** Match sibling header icon buttons (chat uses `small`). */
    size?: "small" | "medium" | "large";
};

/**
 * Link to the marketing home page (`/`).
 */
export function NavHomeButton({ size = "medium" }: NavHomeButtonProps) {
    return (
        <Tooltip title="Home">
            <IconButton
                component={Link}
                href="/"
                color="primary"
                size={size}
                aria-label="Go to home"
            >
                <HomeRoundedIcon
                    fontSize={size === "small" ? "small" : "medium"}
                />
            </IconButton>
        </Tooltip>
    );
}
