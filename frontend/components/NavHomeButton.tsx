"use client";

import Link from "next/link";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { IconButton, Tooltip } from "@mui/material";

type NavHomeButtonProps = {
    /** IconButton `size`; use `small` on chat toolbar to match neighbors. */
    size?: "small" | "medium" | "large";
};

/**
 * Header control that sends the user back to the marketing home page.
 * Renders a home icon in a `Link` to `/` with a tooltip and accessible label.
 * @param size - MUI `IconButton` size; use `small` on the chat bar to match nearby icons.
 * @returns A `Tooltip` around an `IconButton` linking to `/`.
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
